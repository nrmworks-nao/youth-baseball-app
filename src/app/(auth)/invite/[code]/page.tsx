"use client";

import { useEffect, useState, useCallback } from "react";
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

interface ExistingPlayer {
  id: string;
  name: string;
  number: number | null;
  grade: number | null;
  position: string | null;
  user_children: {
    relationship: string | null;
    users: { display_name: string } | null;
  }[];
}

interface ChildSelection {
  type: "existing" | "new";
  existingPlayerId?: string;
  existingPlayerName?: string;
  newPlayer?: PlayerEntry;
  relationship: string;
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

  // 既存選手一覧
  const [existingPlayers, setExistingPlayers] = useState<ExistingPlayer[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);

  // 子供選択・登録（多対多対応）
  const [selectedChildren, setSelectedChildren] = useState<ChildSelection[]>(
    []
  );
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);
  const [newPlayers, setNewPlayers] = useState<PlayerEntry[]>([emptyPlayer()]);
  const [newPlayerRelationships, setNewPlayerRelationships] = useState<
    string[]
  >(["父"]);

  // 既存選手がいない場合は直接新規登録フォームを表示
  const hasExistingPlayers = existingPlayers.length > 0;

  const fetchExistingPlayers = useCallback(async (teamId: string) => {
    setIsLoadingPlayers(true);
    try {
      const response = await fetch(
        `/api/teams/players?teamId=${encodeURIComponent(teamId)}`
      );
      const data = await response.json();
      if (response.ok && data.players) {
        setExistingPlayers(data.players);
        // 既存選手がいない場合は新規登録フォームを自動表示
        if (data.players.length === 0) {
          setShowNewPlayerForm(true);
        }
      }
    } catch {
      console.error("既存選手の取得に失敗しました");
    } finally {
      setIsLoadingPlayers(false);
    }
  }, []);

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

          // 既存選手一覧を取得
          await fetchExistingPlayers(teamData.id);
        }

        setIsLoading(false);
      } catch {
        setError("招待リンクが無効か期限切れです");
        setIsLoading(false);
      }
    }
    loadInvite();
  }, [code, fetchExistingPlayers]);

  const handleLogin = () => {
    window.location.href = `/login?redirect=/invite/${code}`;
  };

  // 既存選手の選択/解除
  const toggleExistingPlayer = (player: ExistingPlayer, checked: boolean) => {
    if (checked) {
      setSelectedChildren((prev: ChildSelection[]) => [
        ...prev,
        {
          type: "existing",
          existingPlayerId: player.id,
          existingPlayerName: player.name,
          relationship: "父",
        },
      ]);
    } else {
      setSelectedChildren((prev: ChildSelection[]) =>
        prev.filter((c: ChildSelection) => c.existingPlayerId !== player.id)
      );
    }
  };

  // 既存選手の関係性を更新
  const updateExistingRelationship = (playerId: string, relationship: string) => {
    setSelectedChildren((prev: ChildSelection[]) =>
      prev.map((c: ChildSelection) =>
        c.existingPlayerId === playerId ? { ...c, relationship } : c
      )
    );
  };

  // 新規選手フォーム操作
  const addNewPlayer = () => {
    setNewPlayers([...newPlayers, emptyPlayer()]);
    setNewPlayerRelationships([...newPlayerRelationships, "父"]);
  };

  const removeNewPlayer = (index: number) => {
    if (newPlayers.length <= 1) return;
    setNewPlayers(newPlayers.filter((_: PlayerEntry, i: number) => i !== index));
    setNewPlayerRelationships(
      newPlayerRelationships.filter((_: string, i: number) => i !== index)
    );
  };

  const updateNewPlayer = (
    index: number,
    field: keyof PlayerEntry,
    value: string
  ) => {
    const updated = [...newPlayers];
    updated[index] = { ...updated[index], [field]: value };
    setNewPlayers(updated);
  };

  const updateNewPlayerRelationship = (index: number, value: string) => {
    const updated = [...newPlayerRelationships];
    updated[index] = value;
    setNewPlayerRelationships(updated);
  };

  const validateForm = (): string | null => {
    if (!displayName.trim()) return "表示名を入力してください";

    const totalSelected = selectedChildren.length;
    const hasNewPlayers =
      showNewPlayerForm || !hasExistingPlayers;
    let validNewPlayers = 0;

    if (hasNewPlayers) {
      for (let i = 0; i < newPlayers.length; i++) {
        if (newPlayers[i].name.trim() || newPlayers[i].number) {
          if (!newPlayers[i].name.trim())
            return `新規選手${i + 1}の名前を入力してください`;
          if (!newPlayers[i].number)
            return `新規選手${i + 1}の背番号を入力してください`;
          validNewPlayers++;
        }
      }
    }

    if (totalSelected + validNewPlayers === 0) {
      return "最低1人のお子さんを選択または登録してください";
    }

    return null;
  };

  const checkDuplicateNumbers = async () => {
    if (!team) return false;
    const dups = new Set<number>();

    const playersToCheck =
      showNewPlayerForm || !hasExistingPlayers ? newPlayers : [];

    for (const player of playersToCheck) {
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
      // children配列を構築
      const children: {
        existingPlayerId?: string;
        newPlayer?: {
          name: string;
          number?: number;
          grade?: number;
          position?: string;
          throwing_hand?: string;
          batting_hand?: string;
        };
        relationship: string;
      }[] = [];

      // 既存選手の選択
      for (const child of selectedChildren) {
        if (child.type === "existing" && child.existingPlayerId) {
          children.push({
            existingPlayerId: child.existingPlayerId,
            relationship: child.relationship,
          });
        }
      }

      // 新規選手の登録
      const hasNewPlayers = showNewPlayerForm || !hasExistingPlayers;
      if (hasNewPlayers) {
        for (let i = 0; i < newPlayers.length; i++) {
          const p = newPlayers[i];
          if (!p.name.trim()) continue;
          children.push({
            newPlayer: {
              name: p.name,
              number: p.number ? parseInt(p.number) : undefined,
              grade: p.grade ? parseInt(p.grade) : undefined,
              position: p.position || undefined,
              throwing_hand: p.throwing_hand || undefined,
              batting_hand: p.batting_hand || undefined,
            },
            relationship: newPlayerRelationships[i] || "父",
          });
        }
      }

      const response = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team.id,
          userId,
          displayName,
          phone: phone || undefined,
          children,
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

  // 新規選手登録フォーム（共通コンポーネント）
  const renderNewPlayerForm = (player: PlayerEntry, index: number) => (
    <div
      key={`new-${index}`}
      className="relative rounded-xl border border-gray-200 p-4"
    >
      {newPlayers.length > 1 && (
        <button
          className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
          onClick={() => removeNewPlayer(index)}
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
          新規選手 {index + 1}
        </p>
        <Input
          id={`new-player-name-${index}`}
          label="名前 *"
          placeholder="例: 山田一郎"
          value={player.name}
          onChange={(e) => updateNewPlayer(index, "name", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            id={`new-player-number-${index}`}
            label="背番号 *"
            placeholder="例: 10"
            type="number"
            value={player.number}
            onChange={(e) => updateNewPlayer(index, "number", e.target.value)}
          />
          <Select
            label="学年"
            value={player.grade}
            onChange={(e) => updateNewPlayer(index, "grade", e.target.value)}
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
          onChange={(e) => updateNewPlayer(index, "position", e.target.value)}
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
              updateNewPlayer(index, "throwing_hand", e.target.value)
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
              updateNewPlayer(index, "batting_hand", e.target.value)
            }
          >
            <option value="">選択</option>
            <option value="右打">右打</option>
            <option value="左打">左打</option>
            <option value="両打">両打</option>
          </Select>
        </div>
        <Select
          label="あなたとの関係 *"
          value={newPlayerRelationships[index] || "父"}
          onChange={(e) => updateNewPlayerRelationship(index, e.target.value)}
        >
          {RELATIONSHIPS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );

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
          </div>
        </section>

        {/* お子様の選択・登録 */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            お子様の情報
          </h2>

          {isLoadingPlayers ? (
            <div className="py-4 text-center text-sm text-gray-500">
              選手情報を読み込み中...
            </div>
          ) : hasExistingPlayers ? (
            /* フロー2: 既存選手がいる場合 */
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                チームに登録済みの選手から、あなたのお子さんを選んでください
              </p>

              {/* 既存選手一覧 */}
              <div className="space-y-2">
                {existingPlayers.map((player) => {
                  const isSelected = selectedChildren.some(
                    (c) => c.existingPlayerId === player.id
                  );
                  const selectedChild = selectedChildren.find(
                    (c) => c.existingPlayerId === player.id
                  );
                  const guardianInfo = player.user_children
                    ?.map(
                      (uc) =>
                        `${uc.users?.display_name || "不明"}（${uc.relationship || "不明"}）`
                    )
                    .join("、");

                  return (
                    <div
                      key={player.id}
                      className={`rounded-lg border p-3 transition-colors ${
                        isSelected
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200"
                      }`}
                    >
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          checked={isSelected}
                          onChange={(e) =>
                            toggleExistingPlayer(player, e.target.checked)
                          }
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {player.name}
                            {player.number != null && (
                              <span className="ml-1 text-gray-500">
                                （背番号{player.number}
                                {player.grade != null &&
                                  `、${player.grade}年`}
                                ）
                              </span>
                            )}
                          </div>
                          {guardianInfo && (
                            <div className="mt-0.5 text-xs text-gray-500">
                              登録済み保護者: {guardianInfo}
                            </div>
                          )}
                        </div>
                      </label>

                      {/* 選択時に関係性を選択 */}
                      {isSelected && (
                        <div className="ml-7 mt-2">
                          <Select
                            label="あなたとの関係 *"
                            value={selectedChild?.relationship || "父"}
                            onChange={(e) =>
                              updateExistingRelationship(
                                player.id,
                                e.target.value
                              )
                            }
                          >
                            {RELATIONSHIPS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </Select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 新規登録ボタン/フォーム */}
              {!showNewPlayerForm ? (
                <button
                  className="w-full rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-600 hover:border-green-500 hover:text-green-600"
                  onClick={() => setShowNewPlayerForm(true)}
                >
                  該当する子供がいない場合は新しく登録
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      新規選手登録
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={addNewPlayer}
                      >
                        + もう1人追加
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowNewPlayerForm(false);
                          setNewPlayers([emptyPlayer()]);
                          setNewPlayerRelationships(["父"]);
                        }}
                      >
                        閉じる
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {newPlayers.map((player, index) =>
                      renderNewPlayerForm(player, index)
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* フロー1: 既存選手がいない場合（新規登録のみ） */
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                チームにはまだ選手が登録されていません。お子さんの情報を入力してください。
              </p>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  選手登録
                </h3>
                <Button variant="ghost" size="sm" onClick={addNewPlayer}>
                  + もう1人追加
                </Button>
              </div>

              <div className="space-y-4">
                {newPlayers.map((player, index) =>
                  renderNewPlayerForm(player, index)
                )}
              </div>
            </div>
          )}
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
