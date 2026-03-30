"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Step = "team" | "role";

const DISPLAY_TITLE_OPTIONS = [
  { value: "監督", label: "監督" },
  { value: "コーチ", label: "コーチ" },
  { value: "部長", label: "部長" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("team");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamData, setTeamData] = useState({
    name: "",
    region: "",
    league: "",
  });
  const [displayTitle, setDisplayTitle] = useState("監督");

  const handleCreateTeam = async () => {
    if (!teamData.name.trim()) return;

    setIsSubmitting(true);
    try {
      // TODO: Supabaseにチーム作成 + team_admin権限のメンバー登録
      // const team = await createTeam(teamData);
      // await addTeamMember({ team_id: team.id, user_id: currentUser.id, permission_group: 'team_admin', display_title: displayTitle });
      console.log("チーム作成:", teamData, "表示呼称:", displayTitle);
      window.location.href = "/home";
    } catch (error) {
      console.error("チーム作成エラー:", error);
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
            <div className="rounded-xl bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">
                チーム管理者として登録されます
              </p>
              <p className="mt-1 text-xs text-green-600">
                権限グループ: team_admin（すべての機能にアクセス可能）
              </p>
            </div>

            <Select
              id="display-title"
              label="表示呼称を選択"
              options={DISPLAY_TITLE_OPTIONS}
              value={displayTitle}
              onChange={(e) => setDisplayTitle(e.target.value)}
            />

            <p className="text-xs text-gray-500">
              表示呼称はメンバーに表示される肩書きです。権限には影響しません。
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
