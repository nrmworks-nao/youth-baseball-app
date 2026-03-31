import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  sendGroupNotification,
  formatPostNotification,
  formatEventNotification,
  formatPaymentNotification,
  formatProductNotification,
  formatNotificationMessage,
} from "@/lib/line/notify";

/**
 * LINE通知送信API
 * クライアントから呼び出して、チームのLINEグループに通知を送信する
 * 同時にnotificationsテーブルにレコードを作成する
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      team_id,
      notification_type,
      title,
      message_body,
      link,
      // 個別通知用
      target_user_ids,
      // メタデータ
      meta,
    } = body as {
      team_id: string;
      notification_type: string;
      title: string;
      message_body?: string;
      link?: string;
      target_user_ids?: string[];
      meta?: {
        author_name?: string;
        event_title?: string;
        amount?: number;
        product_name?: string;
        comment?: string;
        opponent_team?: string;
        player_name?: string;
        badge_category?: string;
      };
    };

    if (!team_id || !notification_type || !title) {
      return NextResponse.json(
        { error: "team_id, notification_type, title are required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

    // LINE設定を取得
    const { data: lineConfig } = await supabase
      .from("team_line_config")
      .select("*")
      .eq("team_id", team_id)
      .single();

    // 通知カテゴリ別のフラグチェック
    const shouldSendLine = lineConfig?.is_active && lineConfig?.line_group_id && (() => {
      switch (notification_type) {
        case "post": return lineConfig.notify_post !== false;
        case "event": return lineConfig.notify_event !== false;
        case "payment": return lineConfig.notify_payment !== false;
        case "shop": return lineConfig.notify_shop !== false;
        default: return true;
      }
    })();

    // LINE通知送信（失敗してもメイン処理は継続）
    if (shouldSendLine && lineConfig?.line_channel_access_token) {
      try {
        let lineMessage: string;
        switch (notification_type) {
          case "post":
            lineMessage = formatPostNotification(
              meta?.author_name ?? "",
              title,
              appUrl
            );
            break;
          case "event":
            lineMessage = formatEventNotification(
              meta?.author_name ?? "",
              meta?.event_title ?? title,
              appUrl
            );
            break;
          case "payment":
            lineMessage = formatPaymentNotification(
              title,
              meta?.amount ?? 0,
              appUrl
            );
            break;
          case "shop":
            lineMessage = formatProductNotification(
              meta?.author_name ?? "",
              meta?.product_name ?? title,
              meta?.comment ?? "",
              appUrl
            );
            break;
          case "match_request":
            lineMessage = formatNotificationMessage({
              senderName: meta?.opponent_team ?? "",
              category: "練習試合",
              preview: title,
              deepLink: link ? `${appUrl}${link}` : `${appUrl}/teams/matches`,
            });
            break;
          case "badge":
            lineMessage = formatNotificationMessage({
              senderName: "表彰",
              category: meta?.badge_category ?? "バッジ",
              preview: `${meta?.player_name ?? ""}さんが表彰されました！`,
              deepLink: `${appUrl}/kids`,
            });
            break;
          default:
            lineMessage = formatNotificationMessage({
              senderName: "",
              category: notification_type,
              preview: title,
              deepLink: link ? `${appUrl}${link}` : undefined,
            });
        }

        await sendGroupNotification(
          lineConfig.line_group_id,
          lineMessage,
          { channelAccessToken: lineConfig.line_channel_access_token }
        );
      } catch (lineError) {
        console.error("LINE通知送信エラー:", lineError);
        // LINE通知送信が失敗してもメイン処理は成功として扱う
      }
    }

    // notificationsテーブルにレコード作成
    // target_user_idsが指定されている場合は各ユーザーに通知
    // 指定されていない場合はチームメンバー全員に通知
    let resolvedUserIds: string[] = target_user_ids ?? [];
    if (resolvedUserIds.length === 0) {
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", team_id)
        .eq("is_active", true);
      resolvedUserIds = members?.map((m: { user_id: string }) => m.user_id) ?? [];
    }

    if (resolvedUserIds.length > 0) {
      const notifications = resolvedUserIds.map((userId: string) => ({
        team_id,
        user_id: userId,
        title,
        body: message_body ?? null,
        notification_type,
        link: link ?? null,
        is_sent_line: !!shouldSendLine,
      }));

      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (insertError) {
        console.error("通知レコード作成エラー:", insertError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("通知送信APIエラー:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "不明なエラー" },
      { status: 500 }
    );
  }
}
