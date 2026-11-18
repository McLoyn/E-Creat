import { randomUUID } from 'crypto';
export class AppError extends Error {
    code;
    status;
    details;
    constructor({ code, message, status, details }) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.status = status;
        this.details = details;
    }
}
export function requestIdMiddleware(req, _res, next) {
    req.requestId = req.headers['x-request-id'] || randomUUID();
    next();
}
export function errorHandler(err, req, res, _next) {
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
