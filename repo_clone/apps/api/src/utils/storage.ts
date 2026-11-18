import { createClient, SupabaseClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { envConfig } from './env.js';
import { AppError } from '../middlewares/error.js';

let supabaseClient: SupabaseClient | null = null;
if (envConfig.supabaseUrl && envConfig.supabaseServiceRoleKey) {
  supabaseClient = createClient(envConfig.supabaseUrl, envConfig.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}

// Magic bytes validation for true file signature verification
export function validateImageSignature(buffer: Buffer, declaredMime: string): boolean {
  if (buffer.length < 12) return false;

  // JPEG signature: FF D8 FF
  if (declaredMime === 'image/jpeg' || declaredMime === 'image/jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (declaredMime === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // WebP signature: RIFF....WEBP
  if (declaredMime === 'image/webp') {
    const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
    const isWebp = buffer.toString('ascii', 8, 12) === 'WEBP';
    return isRiff && isWebp;
  }

  return false;
}

export interface UploadResult {
  path: string;
  filename: string;
  size: number;
  mimetype: string;
  storageProvider: 'supabase' | 'local';
}

export async function uploadImage(
  buffer: Buffer,
  originalFilename: string,
  mimetype: string,
  folder: 'profiles' | 'works' | 'products' | 'general' = 'general'
): Promise<UploadResult> {
  // 1. Validate file size (2MB limit)
  if (buffer.length > 2 * 1024 * 1024) {
    throw new AppError({
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Ukuran file gambar melebihi batas maksimal 2MB.',
      status: 413,
    });
  }

  // 2. Validate MIME type
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimes.includes(mimetype)) {
    throw new AppError({
      code: 'UNSUPPORTED_MEDIA_TYPE',
      message: 'Hanya format gambar JPEG, PNG, dan WebP yang didukung.',
      status: 415,
    });
  }

  // 3. Cryptographic Magic Bytes signature validation (Anti-MIME spoofing)
  if (!validateImageSignature(buffer, mimetype)) {
    throw new AppError({
      code: 'VALIDATION_FAILED',
      message: 'File yang diunggah terdeteksi rusak atau tidak sesuai dengan format gambar yang dinyatakan.',
      status: 422,
    });
  }

  // 4. Generate random, unguessable filename
  const ext = path.extname(originalFilename).toLowerCase() || (mimetype === 'image/png' ? '.png' : mimetype === 'image/webp' ? '.webp' : '.jpg');
  const filename = `${randomUUID()}${ext}`;
  const objectKey = `${folder}/${filename}`;

  // 5. Upload to Supabase Storage if configured
  if (supabaseClient) {
    const bucket = envConfig.supabaseStorageBucket;
    const { error } = await supabaseClient.storage.from(bucket).upload(objectKey, buffer, {
      contentType: mimetype,
      upsert: false,
    });

    if (error) {
      console.error('[Supabase Storage Upload Error]', error);
      throw new AppError({
        code: 'STORAGE_ERROR',
        message: 'Gagal mengunggah file ke Supabase Storage.',
        status: 502,
        details: error.message,
      });
    }

    const { data: publicUrlData } = supabaseClient.storage.from(bucket).getPublicUrl(objectKey);

    return {
      path: publicUrlData.publicUrl,
      filename,
      size: buffer.length,
      mimetype,
      storageProvider: 'supabase',
    };
  }

  // 6. Local Disk Storage Fallback (for development / testing environments without cloud credentials)
  const uploadDir = path.resolve(process.cwd(), 'uploads', folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const destinationPath = path.join(uploadDir, filename);
  fs.writeFileSync(destinationPath, buffer);

  return {
    path: `/uploads/${folder}/${filename}`,
    filename,
    size: buffer.length,
    mimetype,
    storageProvider: 'local',
  };
}

export async function deleteImage(imagePathOrUrl: string): Promise<boolean> {
  if (!imagePathOrUrl) return false;

  try {
    // If Supabase Storage URL
    if (supabaseClient && imagePathOrUrl.includes(envConfig.supabaseStorageBucket)) {
      const bucket = envConfig.supabaseStorageBucket;
      const parts = imagePathOrUrl.split(`${bucket}/`);
      if (parts.length > 1) {
        const objectKey = parts[1];
        const { error } = await supabaseClient.storage.from(bucket).remove([objectKey]);
        if (error) {
          console.error('[Supabase Storage Delete Error]', error);
          return false;
        }
        return true;
      }
    }

    // If local storage path (/uploads/...)
    if (imagePathOrUrl.startsWith('/uploads/')) {
      const relPath = imagePathOrUrl.replace(/^\/uploads\//, '');
      const fullPath = path.resolve(process.cwd(), 'uploads', relPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
    }
  } catch (err) {
    console.warn('[Storage Delete Warning] Failed to delete image file:', imagePathOrUrl, err);
  }

  return false;
}
