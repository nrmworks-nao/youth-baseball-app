"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { supabase } from "@/lib/supabase/client";
import { getTeamByInviteCode } from "@/lib/supabase/queries/teams";
import { isAlreadyMember } from "@/lib/supabase/queries/members";
import type { Team } from "@/types";

interface PlayerEntry {
  name: string;
  number: string;
  grade: string;
  position: string;
  throwing_hand: string;
  batting_hand: string;
}

const POSITIONS = [
  "ピッチャー",
  "キャッチャー",
  "ファースト",
  "セカンド",
  "サード",
  "ショート",
  "レフト",
  "センター",
  "ライト",
];

const GRADES = ["1", "2", "3", "4", "5", "6"];

const RELATIONSHIPS = ["父", "母", "祖父", "祖母", "その他"];

const emptyPlayer = (): PlayerEntry => ({
  name: "",
  number: "",
  grade: "",
  position: "",
  throwing_hand: "",
  batting_hand: "",
});

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [isLoading, setIsLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showPending, setShowPending] = useState(false);
  const [duplicateNumbers, setDuplicateNumbers] = useState<Set<number>>(
    new Set()
  );
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);

  // プロフィール入力
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("父");

  // 子供（選手）登録
  const [players, setPlayers] = useState<PlayerEntry[]>([emptyPlayer()]);

  useEffect(() => {
    async function loadInvite() {
      try {
        // 招待コードでチーム情報を取得
        const teamData = await getTeamByInviteCode(code);
        if (!teamData) {
          setError("招待リンクが無効か期限切れです");
          setIsLoading(false);
          return;
        }
        setTeam(teamData);

        // ログイン状態チェック
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setIsLoggedIn(true);
          setUserId(user.id);

          // ユーザー情報を取得してデフォルト値を設定
          const { data: userData } = await supabase
            .from("users")
            .select("display_name, phone")
            .eq("id", user.id)
            .single();
          if (userData) {
            setDisplayName(userData.display_name || "");
            setPhone(userData.phone || "");
          }

          // 既存メンバーチェック
          const alreadyMember = await isAlreadyMember(teamData.id, user.id);
          if (alreadyMember) {
            setError("既にこのチームに参加しています");
            setIsLoading(false);
            return;
          }
        }

        setIsLoading(false);
      } catch {
        setError("招待リンクが無効か期限切れです");
        setIsLoading(false);
      }
    }
    loadInvite();
  }, [code]);

  const handleLogin = () => {
    // LINEログインページへ遷移（招待コードをリダイレクト先に含める）
    window.location.href = `/login?redirect=/invite/${code}`;
  };

  const addPlayer = () => {
    setPlayers([...players, emptyPlayer()]);
  };

  const removePlayer = (index: number) => {
    if (players.length <= 1) return;
    setPlayers(players.filter((_, i) => i !== index));
  };

  const updatePlayer = (
    index: number,
    field: keyof PlayerEntry,
    value: string
  ) => {
    const updated = [...players];
    updated[index] = { ...updated[index], [field]: value };
    setPlayers(updated);
  };

  const validateForm = (): string | null => {
    if (!displayName.trim()) return "表示名を入力してください";
    for (let i = 0; i < players.length; i++) {
      if (!players[i].name.trim())
        return `選手${i + 1}の名前を入力してください`;
      if (!players[i].number)
        return `選手${i + 1}の背番号を入力してください`;
    }
    return null;
  };

  const checkDuplicateNumbers = async () => {
    if (!team) return false;
    const dups = new Set<number>();
    for (const player of players) {
      if (!player.number) continue;
      const { data } = await supabase
        .from("players")
        .select("id")
        .eq("team_id", team.id)
        .eq("number", parseInt(player.number))
        .eq("is_active", true);
      if (data && data.length > 0) {
        dups.add(parseInt(player.number));
      }
    }
    setDuplicateNumbers(dups);
    return dups.size > 0;
  };

  const handleJoin = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!team || !userId) return;

    // 背番号重複チェック（初回のみ）
    if (!showDuplicateConfirm && (await checkDuplicateNumbers())) {
      setShowDuplicateConfirm(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team.id,
          userId,
          displayName,
          phone: phone || undefined,
          relationship,
          players: players.map((p) => ({
            name: p.name,
            number: p.number ? parseInt(p.number) : undefined,
            grade: p.grade ? parseInt(p.grade) : undefined,
            position: p.position || undefined,
            throwing_hand: p.throwing_hand || undefined,
            batting_hand: p.batting_hand || undefined,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "参加処理に失敗しました");
        setIsSubmitting(false);
        return;
      }

      if (data.isActive) {
        router.push("/home");
      } else {
        setShowPending(true);
      }
    } catch {
      setError("参加処理に失敗しました");
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Loading className="min-h-screen" />;

  if (showPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <div className="text-center">
          <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-yellow-100">
            <svg
              className="h-8 w-8 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-bold text-gray-900">承認待ち</h2>
          <p className="text-sm text-gray-600">
            チーム管理者の承認をお待ちください。
            <br />
            承認されると、チームの機能をご利用いただけます。
          </p>
        </div>
      </div>
    );
  }

  if (error && !team) return <ErrorDisplay message={error} />;

  // 未ログイン → ログイン誘導
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <header className="border-b border-gray-100 px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">チームに参加</h1>
          <p className="text-sm text-green-600">{team?.name}</p>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <p className="mb-6 text-center text-sm text-gray-600">
            チームに参加するにはLINEログインが必要です
          </p>
          <Button onClick={handleLogin} className="w-full max-w-xs" size="lg">
            LINEでログイン
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ヘッダー */}
      <header className="border-b border-gray-100 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">チームに参加</h1>
        <p className="text-sm text-green-600">{team?.name}</p>
      </header>

      <div className="flex-1 space-y-6 px-4 py-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* 背番号重複確認ダイアログ */}
        {showDuplicateConfirm && duplicateNumbers.size > 0 && (
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
            <p className="mb-2 text-sm font-medium text-yellow-800">
              以下の背番号はチーム内で既に使用されています:
            </p>
            <p className="mb-3 text-sm text-yellow-700">
              背番号: {Array.from(duplicateNumbers).join(", ")}
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleJoin} disabled={isSubmitting}>
                {isSubmitting ? "処理中..." : "そのまま登録する"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDuplicateConfirm(false)}
              >
                修正する
              </Button>
            </div>
          </div>
        )}

        {/* 保護者プロフィール */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            あなたの情報
          </h2>
          <div className="space-y-3">
            <Input
              id="display-name"
              label="表示名"
              placeholder="例: 山田太郎"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Input
              id="phone"
              label="電話番号"
              placeholder="例: 090-1234-5678"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Select
              label="お子様との関係"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            >
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
        </section>

        {/* 選手（お子様）登録 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              お子様の情報（選手登録）
            </h2>
            <Button variant="ghost" size="sm" onClick={addPlayer}>
              + 追加
            </Button>
          </div>

          <div className="space-y-4">
            {players.map((player, index) => (
              <div
                key={index}
                className="relative rounded-xl border border-gray-200 p-4"
              >
                {players.length > 1 && (
                  <button
                    className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
                    onClick={() => removePlayer(index)}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-500">
                    選手 {index + 1}
                  </p>
                  <Input
                    id={`player-name-${index}`}
                    label="名前 *"
                    placeholder="例: 山田一郎"
                    value={player.name}
                    onChange={(e) =>
                      updatePlayer(index, "name", e.target.value)
                    }
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      id={`player-number-${index}`}
                      label="背番号 *"
                      placeholder="例: 10"
                      type="number"
                      value={player.number}
                      onChange={(e) =>
                        updatePlayer(index, "number", e.target.value)
                      }
                    />
                    <Select
                      label="学年"
                      value={player.grade}
                      onChange={(e) =>
                        updatePlayer(index, "grade", e.target.value)
                      }
                    >
                      <option value="">選択</option>
                      {GRADES.map((g) => (
                        <option key={g} value={g}>
                          {g}年
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Select
                    label="ポジション"
                    value={player.position}
                    onChange={(e) =>
                      updatePlayer(index, "position", e.target.value)
                    }
                  >
                    <option value="">選択</option>
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="投げ"
                      value={player.throwing_hand}
                      onChange={(e) =>
                        updatePlayer(index, "throwing_hand", e.target.value)
                      }
                    >
                      <option value="">選択</option>
                      <option value="右投">右投</option>
                      <option value="左投">左投</option>
                    </Select>
                    <Select
                      label="打ち"
                      value={player.batting_hand}
                      onChange={(e) =>
                        updatePlayer(index, "batting_hand", e.target.value)
                      }
                    >
                      <option value="">選択</option>
                      <option value="右打">右打</option>
                      <option value="左打">左打</option>
                      <option value="両打">両打</option>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 参加ボタン */}
        {!showDuplicateConfirm && (
          <Button
            className="w-full"
            size="lg"
            onClick={handleJoin}
            disabled={!displayName.trim() || isSubmitting}
          >
            {isSubmitting ? "処理中..." : "チームに参加する"}
          </Button>
        )}
      </div>
    </div>
  );
}
