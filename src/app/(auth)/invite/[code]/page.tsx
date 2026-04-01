"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { supabase } from "@/lib/supabase/client";
import { getTeamByInviteCode } from "@/lib/supabase/queries/teams";
import { isAlreadyMember } from "@/lib/supabase/queries/members";
import { uploadPlayerPhoto } from "@/lib/supabase/storage";
import type { Team } from "@/types";

interface PlayerEntry {
  name: string;
  number: string;
  grade: string;
  position: string;
  throwing_hand: string;
  batting_hand: string;
  photoFile?: File;
  photoPreview?: string;
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

  // 既に別チームに所属しているかチェック
  const [existingTeamName, setExistingTeamName] = useState<string | null>(null);

  // メール/パスワード認証
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isEmailLogging, setIsEmailLogging] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

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

          // 既に別チームに所属しているかチェック（1ユーザー1チーム制限）
          const { data: existingMemberships } = await supabase
            .from("team_members")
            .select("team_id, teams(name)")
            .eq("user_id", user.id)
            .eq("is_active", true);

          if (existingMemberships && existingMemberships.length > 0) {
            const isSameTeam = existingMemberships.some(
              (m: { team_id: string }) => m.team_id === teamData.id
            );
            if (isSameTeam) {
              setError("既にこのチームに参加しています");
              setIsLoading(false);
              return;
            }
            // 別チームに所属中
            const teamName = (existingMemberships[0] as { teams: { name: string } | null }).teams?.name || "不明";
            setExistingTeamName(teamName);
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

  const handleLineLogin = () => {
    window.location.href = `/login?redirect=/invite/${code}`;
  };

  // メール/パスワードでログイン
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    if (!loginEmail.trim() || !loginPassword) {
      setEmailError("メールアドレスとパスワードを入力してください");
      return;
    }

    setIsEmailLogging(true);
    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: loginEmail.trim(),
          password: loginPassword,
        });

      if (signInError) {
        setEmailError("メールアドレスまたはパスワードが正しくありません");
        return;
      }

      // Cookie設定のためサーバーサイドで処理
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setEmailError(result.error || "ログインに失敗しました");
        return;
      }

      // ログイン成功 → 招待ページをリロードしてログイン済み状態で表示
      window.location.href = `/invite/${code}`;
    } catch {
      setEmailError("ログインに失敗しました。再度お試しください。");
    } finally {
      setIsEmailLogging(false);
    }
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

      // 写真アップロード（新規選手のみ、playerIds順に対応）
      if (data.playerIds && data.playerIds.length > 0) {
        const hasNewPlayers = showNewPlayerForm || !hasExistingPlayers;
        if (hasNewPlayers) {
          // 新規選手のファイルを持つもののみ抽出
          const newPlayersWithPhotos = newPlayers
            .filter((p: PlayerEntry) => p.name.trim() && p.photoFile);

          // playerIdsのうち、既存選手分を除いたものが新規選手のID
          const existingIds = selectedChildren
            .filter((c: ChildSelection) => c.type === "existing")
            .map((c: ChildSelection) => c.existingPlayerId);
          const newPlayerIds = (data.playerIds as string[]).filter(
            (id: string) => !existingIds.includes(id)
          );

          // 新規選手の登録順とphotoFile付きのマッピング
          let photoIndex = 0;
          for (let i = 0; i < newPlayers.length; i++) {
            const p = newPlayers[i];
            if (!p.name.trim()) continue;
            if (p.photoFile && newPlayerIds[photoIndex]) {
              try {
                await uploadPlayerPhoto(
                  p.photoFile,
                  team.id,
                  newPlayerIds[photoIndex]
                );
              } catch {
                // 写真アップロード失敗は参加自体に影響しない
              }
            }
            photoIndex++;
          }
        }
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

  // 既に別チームに所属している場合
  if (existingTeamName) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <div className="text-center max-w-sm">
          <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-orange-100">
            <svg
              className="h-8 w-8 text-orange-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-bold text-gray-900">別のチームに所属中</h2>
          <p className="text-sm text-gray-600">
            既に「{existingTeamName}」に所属しています。別のチームに参加するには、先に現在のチームを退会してください。
          </p>
          <Link href="/mypage">
            <Button className="mt-6 w-full" size="lg">
              マイページへ
            </Button>
          </Link>
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
            チームに参加するにはログインが必要です
          </p>

          <div className="w-full max-w-xs space-y-6">
            {/* メール/パスワードログインフォーム */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <Input
                label="メールアドレス"
                type="email"
                placeholder="example@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                autoComplete="email"
              />
              <Input
                label="パスワード"
                type="password"
                placeholder="8文字以上"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                autoComplete="current-password"
              />
              {emailError && (
                <p className="text-center text-sm text-red-600">{emailError}</p>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isEmailLogging}
              >
                {isEmailLogging ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : null}
                ログイン
              </Button>
              <p className="text-center text-sm text-gray-500">
                アカウントをお持ちでない方は{" "}
                <Link
                  href={`/register?redirect=/invite/${code}`}
                  className="text-green-600 hover:underline font-medium"
                >
                  新規登録
                </Link>
              </p>
            </form>

            {/* 区切り線 */}
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-sm text-gray-400">または</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* LINEログインボタン */}
            <Button
              variant="line"
              size="lg"
              className="w-full"
              onClick={handleLineLogin}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              LINEでログイン
            </Button>
          </div>
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

        {/* 写真（任意） */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              document.getElementById(`new-player-photo-${index}`)?.click()
            }
            className="relative group"
          >
            {player.photoPreview ? (
              <img
                src={player.photoPreview}
                alt="プレビュー"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center border-2 border-dashed border-gray-300 text-lg">
                {player.name ? player.name.charAt(0) : "+"}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
              </svg>
            </div>
          </button>
          <input
            id={`new-player-photo-${index}`}
            type="file"
            accept="image/jpeg,image/png,image/heic,image/heif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const updated = [...newPlayers];
                updated[index] = {
                  ...updated[index],
                  photoFile: file,
                  photoPreview: URL.createObjectURL(file),
                };
                setNewPlayers(updated);
              }
            }}
          />
          <span className="text-[10px] text-gray-400">写真（任意）</span>
        </div>

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
            label="背番号（任意）"
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
