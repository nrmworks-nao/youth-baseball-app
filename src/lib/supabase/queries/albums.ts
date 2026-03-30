import { supabase } from "@/lib/supabase/client";
import type { Album, AlbumPhoto } from "@/types";

/** アルバム一覧取得 */
export async function getAlbums(teamId: string) {
  const { data, error } = await supabase
    .from("albums")
    .select("*, events(title)")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as (Album & { events?: { title: string } })[];
}

/** アルバム詳細取得 */
export async function getAlbum(albumId: string) {
  const { data, error } = await supabase
    .from("albums")
    .select("*, events(title)")
    .eq("id", albumId)
    .single();
  if (error) throw error;
  return data as Album;
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

/** アルバムの写真一覧取得 */
export async function getAlbumPhotos(albumId: string) {
  const { data, error } = await supabase
    .from("album_photos")
    .select("*, users!album_photos_uploaded_by_fkey(display_name)")
    .eq("album_id", albumId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as AlbumPhoto[];
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

/** 写真削除 */
export async function deleteAlbumPhoto(photoId: string) {
  const { error } = await supabase
    .from("album_photos")
    .delete()
    .eq("id", photoId);
  if (error) throw error;
}

/** いいね追加 */
export async function likePhoto(photoId: string, teamId: string, userId: string) {
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
