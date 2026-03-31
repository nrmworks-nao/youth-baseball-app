import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

/**
 * LINE Webhook受信エンドポイント
 * グループ参加時のgroup_id自動取得などを処理
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");

  // 署名検証（チャネルシークレットが設定されている場合）
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (channelSecret && signature) {
    const hash = crypto
      .createHmac("SHA256", channelSecret)
      .update(body)
      .digest("base64");
    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const events = JSON.parse(body).events;
  const supabase = createServerClient();

  for (const event of events) {
    switch (event.type) {
      case "join": {
        // Botがグループに参加した時、group_idを保存
        if (event.source.type === "group") {
          const groupId = event.source.groupId;
          // team_line_configにgroup_idを更新
          // line_group_idがまだ設定されていないチームに紐づけ
          await supabase
            .from("team_line_config")
            .update({ line_group_id: groupId })
            .is("line_group_id", null);
        }
        break;
      }
      case "follow": {
        // ユーザーがBotを友達追加した時
        // LINE UserIDをusersテーブルで照合し紐づけを記録
        const lineUserId = event.source.userId;
        if (lineUserId) {
          // line_idが一致するユーザーを検索してline_user_idを記録
          const { data: user } = await supabase
            .from("users")
            .select("id")
            .eq("line_id", lineUserId)
            .single();

          if (user) {
            await supabase
              .from("users")
              .update({ line_user_id: lineUserId })
              .eq("id", user.id);
          } else {
            // line_idで見つからない場合、line_user_idで直接設定
            // ユーザーが後でLIFFログインした時に紐づけされる
            console.log(`LINE follow: user not found for lineUserId=${lineUserId}`);
          }
        }
        break;
      }
      case "leave": {
        // Botがグループから退出した時
        // team_line_configのline_group_idをクリア
        if (event.source.type === "group") {
          const groupId = event.source.groupId;
          await supabase
            .from("team_line_config")
            .update({ line_group_id: null })
            .eq("line_group_id", groupId);
        }
        break;
      }
      case "message": {
        // TODO: メッセージ受信（将来拡張用）
        break;
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
