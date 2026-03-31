/**
 * クライアントサイドからLINE通知+アプリ内通知を送信するヘルパー
 * サーバーサイドAPI (/api/notifications/line) を呼び出す
 * 失敗してもエラーを投げない（メイン処理を中断しない）
 */
export async function sendNotification(params: {
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
}): Promise<void> {
  try {
    await fetch("/api/notifications/line", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch (err) {
    console.error("通知送信エラー:", err);
    // 通知送信失敗はメイン処理を中断しない
  }
}
