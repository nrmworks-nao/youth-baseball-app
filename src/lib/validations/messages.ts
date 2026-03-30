/**
 * Zod バリデーション用の日本語エラーメッセージ
 */
export const zodMessages = {
  required: "この項目は必須です",
  string: {
    min: (min: number) => `${min}文字以上で入力してください`,
    max: (max: number) => `${max}文字以下で入力してください`,
    email: "正しいメールアドレスを入力してください",
    url: "正しいURLを入力してください",
  },
  number: {
    min: (min: number) => `${min}以上の数値を入力してください`,
    max: (max: number) => `${max}以下の数値を入力してください`,
    positive: "正の数値を入力してください",
    int: "整数を入力してください",
  },
  date: {
    min: "日付が早すぎます",
    max: "日付が遅すぎます",
    invalid: "正しい日付を入力してください",
  },
  array: {
    min: (min: number) => `${min}件以上選択してください`,
    max: (max: number) => `${max}件以下にしてください`,
  },
  select: "選択してください",
} as const;
