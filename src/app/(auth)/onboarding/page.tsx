"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { supabase } from "@/lib/supabase/client";
import { ROLE_OPTIONS } from "@/lib/utils/roles";

type Step = "team" | "role";

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("team");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [teamData, setTeamData] = useState({
    name: "",
    region: "",
    league: "",
  });
  const [permissionGroup, setPermissionGroup] = useState("director");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        console.log("onboarding - session user.id:", session.user.id);
        setUserId(session.user.id);

        // 既にチームに所属している場合は /home にリダイレクト
        const { data: existingMemberships } = await supabase
          .from("team_members")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("is_active", true)
          .limit(1);

        if (existingMemberships && existingMemberships.length > 0) {
          console.log("onboarding - 既にチーム所属済み、/homeへリダイレクト");
          window.location.href = "/home";
          return;
        }
      } else {
        console.log("onboarding - セッションなし、/loginへリダイレクト");
        window.location.href = "/login";
      }
    });
  }, []);

  const handleCreateTeam = async () => {
    if (!teamData.name.trim()) return;
    if (!userId) {
      setErrorMessage("ログインが必要です。再度ログインしてください。");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      console.log("onboarding - チーム作成リクエスト userId:", userId);
      const res = await fetch("/api/teams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teamData.name,
          region: teamData.region,
          league: teamData.league,
          userId,
          permissionGroup,
        }),
      });

      const data = await res.json();
      console.log("onboarding - チーム作成レスポンス:", data);

      if (!res.ok) {
        setErrorMessage(data.error || "チームの作成に失敗しました");
        return;
      }

      // チーム作成成功後、セッションのuser.idでteam_membersが参照できることを確認
      const { data: { session } } = await supabase.auth.getSession();
      console.log("onboarding - 遷移前のsession user.id:", session?.user?.id);

      window.location.href = "/home";
    } catch (error) {
      console.error("チーム作成エラー:", error);
      setErrorMessage(
        "ネットワークエラーが発生しました。接続を確認してもう一度お試しください。"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ヘッダー */}
      <header className="border-b border-gray-100 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">チームを作成</h1>
        <p className="text-xs text-gray-500">
          新しいチームを作成して始めましょう
        </p>
      </header>

      <div className="flex-1 px-4 py-6">
        {errorMessage && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {step === "team" && (
          <div className="space-y-5">
            <Input
              id="team-name"
              label="チーム名"
              placeholder="例: 〇〇少年野球クラブ"
              value={teamData.name}
              onChange={(e) =>
                setTeamData({ ...teamData, name: e.target.value })
              }
            />
            <Input
              id="region"
              label="地域"
              placeholder="例: 東京都世田谷区"
              value={teamData.region}
              onChange={(e) =>
                setTeamData({ ...teamData, region: e.target.value })
              }
            />
            <Input
              id="league"
              label="所属リーグ（任意）"
              placeholder="例: 世田谷区少年野球連盟"
              value={teamData.league}
              onChange={(e) =>
                setTeamData({ ...teamData, league: e.target.value })
              }
            />

            <Button
              className="w-full"
              size="lg"
              onClick={() => setStep("role")}
              disabled={!teamData.name.trim()}
            >
              次へ
            </Button>
          </div>
        )}

        {step === "role" && (
          <div className="space-y-5">
            <Select
              id="permission-group"
              label="あなたの役割"
              options={ROLE_OPTIONS}
              value={permissionGroup}
              onChange={(e) => setPermissionGroup(e.target.value)}
            />

            <p className="text-xs text-gray-500">
              チーム作成者にはサイト管理者権限が自動で付与されます。役割はチーム内での立場を表します。
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("team")}
              >
                戻る
              </Button>
              <Button
                className="flex-1"
                size="lg"
                onClick={handleCreateTeam}
                disabled={isSubmitting}
              >
                {isSubmitting ? "作成中..." : "チームを作成"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
