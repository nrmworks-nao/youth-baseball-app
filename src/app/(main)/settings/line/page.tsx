"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { getTeamLineConfig, upsertTeamLineConfig } from "@/lib/supabase/queries/notifications";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import type { TeamLineConfig } from "@/types";

export default function LineSettingsPage() {
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { isAdmin } = usePermission(currentMembership?.permission_group ?? null);

  const [config, setConfig] = useState<TeamLineConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ローカル編集状態
  const [isActive, setIsActive] = useState(false);
  const [notifyPost, setNotifyPost] = useState(true);
  const [notifyEvent, setNotifyEvent] = useState(true);
  const [notifyPayment, setNotifyPayment] = useState(true);
  const [notifyShop, setNotifyShop] = useState(false);
  const [batchMode, setBatchMode] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentTeam) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTeamLineConfig(currentTeam.id);
      setConfig(data);
      if (data) {
        setIsActive(data.is_active);
        setNotifyPost(data.notify_post);
        setNotifyEvent(data.notify_event);
        setNotifyPayment(data.notify_payment);
        setNotifyShop(data.notify_shop);
        setBatchMode(data.batch_mode);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  useEffect(() => {
    if (!teamLoading && currentTeam) {
      fetchData();
    }
  }, [teamLoading, currentTeam, fetchData]);

  const handleSave = async () => {
    if (!currentTeam) return;
    setIsSaving(true);
    try {
      const updated = await upsertTeamLineConfig({
        team_id: currentTeam.id,
        is_active: isActive,
      });
      setConfig(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (field: string, value: boolean) => {
    if (!currentTeam) return;
    // ローカル状態を即座に更新
    switch (field) {
      case "notify_post": setNotifyPost(value); break;
      case "notify_event": setNotifyEvent(value); break;
      case "notify_payment": setNotifyPayment(value); break;
      case "notify_shop": setNotifyShop(value); break;
      case "batch_mode": setBatchMode(value); break;
      case "is_active": setIsActive(value); break;
    }
    // DBに保存
    try {
      await upsertTeamLineConfig({
        team_id: currentTeam.id,
        [field]: value,
      } as Parameters<typeof upsertTeamLineConfig>[0]);
    } catch (err) {
      setError(getErrorMessage(err));
      // 失敗時にロールバック
      fetchData();
    }
  };

  if (teamLoading || isLoading) {
    return <Loading text="LINE設定を読み込み中..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  if (!currentTeam) {
    return <ErrorDisplay title="チーム未選択" message="チームを選択してください。" />;
  }

  if (!isAdmin()) {
    return <ErrorDisplay title="アクセス権限がありません" message="この設定はチーム管理者のみ変更できます。" />;
  }

  const isConnected = !!config?.line_group_id;

  const notifyItems = [
    { key: "notify_post", label: "投稿・連絡", value: notifyPost },
    { key: "notify_event", label: "イベント・予定", value: notifyEvent },
    { key: "notify_payment", label: "会費・集金", value: notifyPayment },
    { key: "notify_shop", label: "おすすめ商品", value: notifyShop },
  ];

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/settings" className="text-gray-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h2 className="text-base font-bold text-gray-900">LINE連携設定</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* Bot設定 */}
        <Card>
          <CardHeader>
            <CardTitle>LINE Bot接続状態</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">グループ接続</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  isConnected
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}>
                  {isConnected ? "接続済み" : "未接続"}
                </span>
              </div>
              {!isConnected && (
                <p className="text-xs text-gray-400">
                  Botをグループに招待すると自動で接続されます
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">LINE通知を有効にする</span>
                <ToggleSwitch
                  value={isActive}
                  onChange={(v) => handleToggle("is_active", v)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 通知項目設定 */}
        <Card>
          <CardHeader>
            <CardTitle>通知項目</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifyItems.map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <ToggleSwitch
                    value={item.value}
                    onChange={(v) => handleToggle(item.key, v)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* まとめ通知モード */}
        <Card>
          <CardHeader>
            <CardTitle>まとめ通知</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">まとめ通知モード</p>
                <p className="text-xs text-gray-400">
                  通知をまとめて1日1回送信します
                </p>
              </div>
              <ToggleSwitch
                value={batchMode}
                onChange={(v) => handleToggle("batch_mode", v)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        value ? "bg-green-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          value ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}
