import { supabase } from "@/lib/supabase/client";

const BUCKET = "team-assets";
const MAX_DIMENSION = 800;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"];

/** 画像をリサイズ（長辺MAX_DIMENSIONpx） */
async function resizeImage(file: File): Promise<Blob> {
  if (file.type === "image/heic" || file.type === "image/heif") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      let newW = width;
      let newH = height;

      if (Math.max(width, height) > MAX_DIMENSION) {
        if (width > height) {
          newW = MAX_DIMENSION;
          newH = Math.round(height * (MAX_DIMENSION / width));
        } else {
          newH = MAX_DIMENSION;
          newW = Math.round(width * (MAX_DIMENSION / height));
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.drawImage(img, 0, 0, newW, newH);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("画像の変換に失敗しました"));
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    img.src = URL.createObjectURL(file);
  });
}

/** 選手プロフィール画像をアップロード */
export async function uploadPlayerPhoto(
  file: File,
  teamId: string,
  playerId: string
): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("JPEG, PNG, HEIC形式の画像を選択してください");
  }

  const resized = await resizeImage(file);
  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `${teamId}/players/${playerId}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, resized, { upsert: true, contentType: `image/${ext === "jpg" ? "jpeg" : ext}` });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // キャッシュバスト用のタイムスタンプ付与
  const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

  // players テーブルを更新
  const { error: updateError } = await supabase
    .from("players")
    .update({ card_photo_url: urlWithCacheBust })
    .eq("id", playerId);

  if (updateError) throw updateError;

  return urlWithCacheBust;
}

/** 選手画像を一時的にアップロード（招待フロー用、playerId未確定時） */
export async function uploadPlayerPhotoTemp(file: File): Promise<File> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("JPEG, PNG, HEIC形式の画像を選択してください");
  }
  // バリデーション済みのファイルをそのまま返す（実際のアップロードはplayerId確定後）
  return file;
}

export { ACCEPTED_TYPES };
