/**
 * LINE通知送信ロジック
 * LINEグループ通知（Bot→グループ）/ 個別通知（Bot→1:1）
 */

interface LineMessage {
  type: "text";
  text: string;
}

interface NotifyOptions {
  channelAccessToken: string;
}

/** LINEグループに通知送信 */
export async function sendGroupNotification(
  groupId: string,
  message: string,
  options: NotifyOptions
) {
  const body: { to: string; messages: LineMessage[] } = {
    to: groupId,
    messages: [{ type: "text", text: message }],
  };

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.channelAccessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LINE API error: ${response.status} ${error}`);
  }
}

/** LINE個別通知送信 */
export async function sendIndividualNotification(
  userId: string,
  message: string,
  options: NotifyOptions
) {
  const body: { to: string; messages: LineMessage[] } = {
    to: userId,
    messages: [{ type: "text", text: message }],
  };

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.channelAccessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LINE API error: ${response.status} ${error}`);
  }
}

/** 通知メッセージフォーマット */
export function formatNotificationMessage(params: {
  senderName: string;
  category: string;
  preview: string;
  deepLink?: string;
}) {
  const lines = [
    `[${params.category}]`,
    `${params.senderName}さんから:`,
    params.preview,
  ];
  if (params.deepLink) {
    lines.push("");
    lines.push(`詳細: ${params.deepLink}`);
  }
  return lines.join("\n");
}

/** チーム通知ヘルパー: 投稿通知 */
export function formatPostNotification(authorName: string, title: string, appUrl: string) {
  return formatNotificationMessage({
    senderName: authorName,
    category: "連絡",
    preview: title,
    deepLink: `${appUrl}/posts`,
  });
}

/** チーム通知ヘルパー: イベント通知 */
export function formatEventNotification(authorName: string, eventTitle: string, appUrl: string) {
  return formatNotificationMessage({
    senderName: authorName,
    category: "予定",
    preview: eventTitle,
    deepLink: `${appUrl}/calendar`,
  });
}

/** チーム通知ヘルパー: 会費通知 */
export function formatPaymentNotification(title: string, amount: number, appUrl: string) {
  return formatNotificationMessage({
    senderName: "会計",
    category: "会費",
    preview: `${title}: ¥${amount.toLocaleString()}`,
    deepLink: `${appUrl}/accounting`,
  });
}

/** チーム通知ヘルパー: おすすめ商品通知 */
export function formatProductNotification(
  recommenderName: string,
  productName: string,
  comment: string,
  appUrl: string
) {
  return formatNotificationMessage({
    senderName: recommenderName,
    category: "おすすめ商品",
    preview: `${productName}\n${comment}`,
    deepLink: `${appUrl}/shop`,
  });
}
