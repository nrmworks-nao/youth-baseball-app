"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";

interface PlayerEntry {
  name: string;
  grade: string;
  number: string;
}

export default function InvitePage() {
  const params = useParams();
  const code = params.code as string;

  const [isLoading, setIsLoading] = useState(true);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // プロフィール入力
  const [displayName, setDisplayName] = useState("");

  // 子供（選手）登録
  const [players, setPlayers] = useState<PlayerEntry[]>([
    { name: "", grade: "", number: "" },
  ]);

  useEffect(() => {
    // 招待コードからチーム情報を取得
    async function fetchInvitation() {
      try {
        // TODO: const invitation = await getTeamByInviteCode(code);
        // setTeamName(invitation.teams.name);
        setTeamName("サンプルチーム"); // デモ用
        setIsLoading(false);
      } catch {
        setError("招待リンクが無効か期限切れです");
        setIsLoading(false);
      }
    }
    fetchInvitation();
  }, [code]);

  const addPlayer = () => {
    setPlayers([...players, { name: "", grade: "", number: "" }]);
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

  const handleJoin = async () => {
    if (!displayName.trim()) return;

    setIsSubmitting(true);
    try {
      // TODO: チーム参加処理
      // 1. team_membersにparent権限で追加
      // 2. 選手情報を登録
      // 3. 保護者-選手紐づけを登録
      console.log("参加:", { code, displayName, players });
      window.location.href = "/home";
    } catch {
      setError("参加処理に失敗しました");
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Loading className="min-h-screen" />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ヘッダー */}
      <header className="border-b border-gray-100 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">チームに参加</h1>
        <p className="text-sm text-green-600">{teamName}</p>
      </header>

      <div className="flex-1 space-y-6 px-4 py-6">
        {/* 保護者プロフィール */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            あなたの情報
          </h2>
          <Input
            id="display-name"
            label="表示名"
            placeholder="例: 山田太郎"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
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
                    label="名前"
                    placeholder="例: 山田一郎"
                    value={player.name}
                    onChange={(e) =>
                      updatePlayer(index, "name", e.target.value)
                    }
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      id={`player-grade-${index}`}
                      label="学年"
                      placeholder="例: 4"
                      type="number"
                      min="1"
                      max="6"
                      value={player.grade}
                      onChange={(e) =>
                        updatePlayer(index, "grade", e.target.value)
                      }
                    />
                    <Input
                      id={`player-number-${index}`}
                      label="背番号（任意）"
                      placeholder="例: 10"
                      type="number"
                      value={player.number}
                      onChange={(e) =>
                        updatePlayer(index, "number", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 参加ボタン */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleJoin}
          disabled={!displayName.trim() || isSubmitting}
        >
          {isSubmitting ? "処理中..." : "チームに参加する"}
        </Button>
      </div>
    </div>
  );
}
