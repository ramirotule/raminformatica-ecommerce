import { createClient } from "@/lib/supabase/client";
import { convertImageToWebp } from "@/lib/images/toWebp";

export const RAM_MEDIA_BUCKET = "ram-media";

export type UploadedWebp = {
  path: string;
  publicUrl: string;
  fileName: string;
  width: number;
  height: number;
};

/**
 * Convierte a WebP y sube a Supabase Storage.
 * folder examples: products, brand, misc
 */
export async function uploadImageAsWebp(
  file: File,
  folder = "products",
): Promise<UploadedWebp> {
  const webp = await convertImageToWebp(file);
  const supabase = createClient();
  const path = `${folder}/${crypto.randomUUID()}-${webp.fileName}`;

  const { error } = await supabase.storage
    .from(RAM_MEDIA_BUCKET)
    .upload(path, webp.blob, {
      contentType: "image/webp",
      upsert: false,
      cacheControl: "31536000",
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage
    .from(RAM_MEDIA_BUCKET)
    .getPublicUrl(path);

  return {
    path,
    publicUrl: data.publicUrl,
    fileName: webp.fileName,
    width: webp.width,
    height: webp.height,
  };
}

export async function removeStoragePath(path: string) {
  if (!path) return;
  const supabase = createClient();
  await supabase.storage.from(RAM_MEDIA_BUCKET).remove([path]);
}
