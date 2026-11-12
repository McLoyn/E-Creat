import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface AppErrorOptions {
  code: string;
  message: string;
  status: number;
  details?: any;
}

export class AppError extends Error {
  public code: string;
  public status: number;
  public details?: any;

  constructor({ code, message, status, details }: AppErrorOptions) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.requestId = (req.headers['x-request-id'] as string) || randomUUID();
  next();
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.requestId || randomUUID();

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        status: err.status,
        details: err.details,
        requestId,
      },
    });
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Ukuran file melebihi batas maksimal 2MB.',
          status: 413,
          requestId,
        },
      });
    }
  }

  console.error(`[Error ${requestId}]`, err);

  const status = typeof err.status === 'number' ? err.status : 500;
  const message = err.message || 'Terjadi kesalahan internal server.';
  const code = err.code || 'INTERNAL_ERROR';

  return res.status(status).json({
    error: {
      code,
      message,
      status,
      requestId,
    },
  });
}
