import { supabase } from "@/lib/supabase/client";
import type { Album, AlbumPhoto } from "@/types";

/** アルバム一覧取得（写真枚数付き） */
export async function getAlbums(teamId: string) {
  const { data, error } = await supabase
    .from("albums")
    .select("*, events(title), album_photos(count)")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((album) => ({
    ...album,
    event_title: (album.events as { title: string } | null)?.title ?? null,
    photo_count:
      (album.album_photos as unknown as { count: number }[])?.[0]?.count ?? 0,
  })) as (Album & { event_title: string | null; photo_count: number })[];
}

/** アルバム詳細取得 */
export async function getAlbum(albumId: string) {
  const { data, error } = await supabase
    .from("albums")
    .select("*, events(title)")
    .eq("id", albumId)
    .single();
  if (error) throw error;
  return {
    ...data,
    event_title: (data.events as { title: string } | null)?.title ?? null,
  } as Album & { event_title: string | null };
}

/** アルバム作成 */
export async function createAlbum(data: {
  team_id: string;
  title: string;
  description?: string;
  event_id?: string;
  created_by: string;
}) {
  const { data: album, error } = await supabase
    .from("albums")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return album as Album;
}

/** アルバム更新 */
export async function updateAlbum(
  albumId: string,
  data: { title?: string; description?: string; cover_photo_url?: string }
) {
  const { data: album, error } = await supabase
    .from("albums")
    .update(data)
    .eq("id", albumId)
    .select()
    .single();
  if (error) throw error;
  return album as Album;
}

/** アルバム削除 */
export async function deleteAlbum(albumId: string) {
  const { error } = await supabase.from("albums").delete().eq("id", albumId);
  if (error) throw error;
}

/** アルバムの写真一覧取得（いいね情報付き） */
export async function getAlbumPhotos(albumId: string, userId: string) {
  const { data, error } = await supabase
    .from("album_photos")
    .select(
      "*, users!album_photos_uploaded_by_fkey(display_name), photo_likes(count)"
    )
    .eq("album_id", albumId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  // ユーザーのいいね状態を取得
  const photoIds = (data ?? []).map((p) => p.id);
  let likedPhotoIds: Set<string> = new Set();
  if (photoIds.length > 0 && userId) {
    const { data: likes } = await supabase
      .from("photo_likes")
      .select("photo_id")
      .eq("user_id", userId)
      .in("photo_id", photoIds);
    likedPhotoIds = new Set((likes ?? []).map((l) => l.photo_id));
  }

  return (data ?? []).map((photo) => ({
    ...photo,
    uploader_name:
      (photo.users as { display_name: string } | null)?.display_name ?? "不明",
    like_count:
      (photo.photo_likes as unknown as { count: number }[])?.[0]?.count ?? 0,
    is_liked: likedPhotoIds.has(photo.id),
  })) as (AlbumPhoto & {
    uploader_name: string;
    like_count: number;
    is_liked: boolean;
  })[];
}

/** アルバムの写真枚数取得 */
export async function getAlbumPhotoCount(albumId: string) {
  const { count, error } = await supabase
    .from("album_photos")
    .select("id", { count: "exact", head: true })
    .eq("album_id", albumId);
  if (error) throw error;
  return count ?? 0;
}

/** 写真アップロード（レコード作成） */
export async function createAlbumPhoto(data: {
  album_id: string;
  team_id: string;
  photo_url: string;
  thumbnail_url?: string;
  caption?: string;
  taken_at?: string;
  uploaded_by: string;
}) {
  const { data: photo, error } = await supabase
    .from("album_photos")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return photo as AlbumPhoto;
}

/** 写真削除（DBレコード + Storage） */
export async function deleteAlbumPhoto(photoId: string, storagePath: string) {
  // Storage上のファイル削除
  const { error: storageError } = await supabase.storage
    .from("albums")
    .remove([storagePath]);
  if (storageError) throw storageError;

  // DBレコード削除
  const { error } = await supabase
    .from("album_photos")
    .delete()
    .eq("id", photoId);
  if (error) throw error;
}

/** 複数写真一括削除 */
export async function deleteAlbumPhotos(
  photos: { id: string; storagePath: string }[]
) {
  // Storage上のファイル一括削除
  const paths = photos.map((p) => p.storagePath);
  const { error: storageError } = await supabase.storage
    .from("albums")
    .remove(paths);
  if (storageError) throw storageError;

  // DBレコード一括削除
  const ids = photos.map((p) => p.id);
  const { error } = await supabase
    .from("album_photos")
    .delete()
    .in("id", ids);
  if (error) throw error;
}

/** いいね追加 */
export async function likePhoto(
  photoId: string,
  teamId: string,
  userId: string
) {
  const { error } = await supabase
    .from("photo_likes")
    .insert({ photo_id: photoId, team_id: teamId, user_id: userId });
  if (error) throw error;
}

/** いいね削除 */
export async function unlikePhoto(photoId: string, userId: string) {
  const { error } = await supabase
    .from("photo_likes")
    .delete()
    .eq("photo_id", photoId)
    .eq("user_id", userId);
  if (error) throw error;
}

/** 写真のいいね数取得 */
export async function getPhotoLikeCount(photoId: string) {
  const { count, error } = await supabase
    .from("photo_likes")
    .select("id", { count: "exact", head: true })
    .eq("photo_id", photoId);
  if (error) throw error;
  return count ?? 0;
}

/** Storage URLからパスを抽出 */
export function extractStoragePath(photoUrl: string): string {
  // publicURL format: .../storage/v1/object/public/albums/...
  const match = photoUrl.match(/\/albums\/(.+)$/);
  return match ? match[1] : "";
}
