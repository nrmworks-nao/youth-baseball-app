"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingOverlay } from "@/components/ui/loading-spinner";
import { PlayerAvatar } from "@/components/features/PlayerAvatar";
import { PlayerPhotoUpload } from "@/components/features/PlayerPhotoUpload";
import { supabase } from "@/lib/supabase/client";
import { uploadPlayerPhoto } from "@/lib/supabase/storage";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import {
  getProfile,
  getMyAllChildren,
  getMyTeamsWithRole,
} from "@/lib/supabase/queries/users";
import { initializeLiff, isLiffInitialized } from "@/lib/line/liff";
import { getRoleLabel } from "@/lib/utils/roles";
import liff from "@line/liff";
import type {
  User,
  TeamWithRole,
  ChildWithTeam,
  NotificationSettings,
} from "@/types";

const POSITION_OPTIONS = [
  { value: "", label: "未選択" },
  { value: "投手", label: "投手" },
  { value: "捕手", label: "捕手" },
  { value: "一塁手", label: "一塁手" },
  { value: "二塁手", label: "二塁手" },
  { value: "三塁手", label: "三塁手" },
  { value: "遊撃手", label: "遊撃手" },
  { value: "左翼手", label: "左翼手" },
  { value: "中堅手", label: "中堅手" },
  { value: "右翼手", label: "右翼手" },
];

const THROWING_OPTIONS = [
  { value: "", label: "未選択" },
  { value: "右投", label: "右投" },
  { value: "左投", label: "左投" },
];

const BATTING_OPTIONS = [
  { value: "", label: "未選択" },
  { value: "右打", label: "右打" },
  { value: "左打", label: "左打" },
  { value: "両打", label: "両打" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "父", label: "父" },
  { value: "母", label: "母" },
  { value: "祖父", label: "祖父" },
  { value: "祖母", label: "祖母" },
  { value: "その他", label: "その他" },
];

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  schedule: true,
  post: true,
  accounting: true,
};

export default function MyPage() {
  const { currentTeam, teams, switchTeam } = useCurrentTeam();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [myTeams, setMyTeams] = useState<TeamWithRole[]>([]);
  const [children, setChildren] = useState<ChildWithTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // プロフィール編集
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 通知設定
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [isSavingNotification, setIsSavingNotification] = useState(false);

  // 子供追加モーダル
  const [showAddChild, setShowAddChild] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [addChildForm, setAddChildForm] = useState({
    name: "",
    number: "",
    grade: "",
    position: "",
    throwing_hand: "",
    batting_hand: "",
    relationship: "父",
    teamId: "",
  });

  // LINE連携
  const [isLinking, setIsLinking] = useState(false);
  const [linkMessage, setLinkMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ログアウト
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 子供編集モーダル
  const [editingChild, setEditingChild] = useState<ChildWithTeam | null>(null);
  const [isSavingChild, setIsSavingChild] = useState(false);
  const [editChildForm, setEditChildForm] = useState({
    name: "",
    number: "",
    grade: "",
    position: "",
    throwing_hand: "",
    batting_hand: "",
  });

  const fetchData = useCallback(async (uid: string) => {
    try {
      const [profileData, teamsData, childrenData] = await Promise.all([
        getProfile(uid),
        getMyTeamsWithRole(uid),
        getMyAllChildren(uid),
      ]);
      setProfile(profileData);
      setDisplayName(profileData.display_name || "");
      setPhone(profileData.phone || "");
      setNotificationSettings(
        profileData.notification_settings || DEFAULT_NOTIFICATION_SETTINGS
      );
      setMyTeams(teamsData);
      setChildren(childrenData);
    } catch (err) {
      console.error("データ取得エラー:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        fetchData(user.id);
      } else {
        setIsLoading(false);
      }
    });
  }, [fetchData]);

  // プロフィール保存
  const handleSaveProfile = async () => {
    if (!userId || !displayName.trim()) return;
    setIsSavingProfile(true);
    setProfileMessage(null);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          display_name: displayName,
          phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfileMessage({ type: "success", text: "プロフィールを保存しました" });
    } catch (err) {
      setProfileMessage({
        type: "error",
        text: err instanceof Error ? err.message : "保存に失敗しました",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 通知設定変更
  const handleToggleNotification = async (
    key: keyof NotificationSettings
  ) => {
    if (!userId) return;
    const newSettings = { ...notificationSettings, [key]: !notificationSettings[key] };
    setNotificationSettings(newSettings);
    setIsSavingNotification(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, notification_settings: newSettings }),
      });
      if (!res.ok) {
        // 元に戻す
        setNotificationSettings(notificationSettings);
      }
    } catch {
      setNotificationSettings(notificationSettings);
    } finally {
      setIsSavingNotification(false);
    }
  };

  // 子供追加
  const handleAddChild = async () => {
    if (!userId || !addChildForm.name.trim() || !addChildForm.teamId) return;
    setIsAddingChild(true);
    try {
      const res = await fetch("/api/users/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          teamId: addChildForm.teamId,
          player: {
            name: addChildForm.name,
            number: addChildForm.number ? parseInt(addChildForm.number) : undefined,
            grade: addChildForm.grade ? parseInt(addChildForm.grade) : undefined,
            position: addChildForm.position || undefined,
            throwing_hand: addChildForm.throwing_hand || undefined,
            batting_hand: addChildForm.batting_hand || undefined,
          },
          relationship: addChildForm.relationship,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // リフレッシュ
      setShowAddChild(false);
      setAddChildForm({
        name: "",
        number: "",
        grade: "",
        position: "",
        throwing_hand: "",
        batting_hand: "",
        relationship: "父",
        teamId: "",
      });
      await fetchData(userId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setIsAddingChild(false);
    }
  };

  // 子供編集開始
  const handleStartEditChild = (child: ChildWithTeam) => {
    setEditingChild(child);
    setEditChildForm({
      name: child.player.name,
      number: child.player.number?.toString() || "",
      grade: child.player.grade?.toString() || "",
      position: child.player.position || "",
      throwing_hand: child.player.throwing_hand || "",
      batting_hand: child.player.batting_hand || "",
    });
  };

  // 子供情報保存
  const handleSaveChild = async () => {
    if (!userId || !editingChild || !editChildForm.name.trim()) return;
    setIsSavingChild(true);
    try {
      const res = await fetch("/api/users/children", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          playerId: editingChild.player.id,
          data: {
            name: editChildForm.name,
            number: editChildForm.number ? parseInt(editChildForm.number) : undefined,
            grade: editChildForm.grade ? parseInt(editChildForm.grade) : undefined,
            position: editChildForm.position || undefined,
            throwing_hand: editChildForm.throwing_hand || undefined,
            batting_hand: editChildForm.batting_hand || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditingChild(null);
      await fetchData(userId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setIsSavingChild(false);
    }
  };

  // LINE連携
  const handleLinkLine = async () => {
    if (!userId) return;
    setIsLinking(true);
    setLinkMessage(null);
    try {
      if (!isLiffInitialized()) {
        await initializeLiff();
      }

      if (!liff.isLoggedIn()) {
        // LINEログイン後にマイページに戻る
        liff.login({ redirectUri: window.location.origin + "/mypage" });
        return;
      }

      const lineProfile = await liff.getProfile();

      // usersテーブルのline_idを更新
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          line_id: lineProfile.userId,
          line_display_name: lineProfile.displayName,
          line_picture_url: lineProfile.pictureUrl || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "LINE連携に失敗しました");
      }

      setLinkMessage({ type: "success", text: "LINE連携が完了しました" });
      await fetchData(userId);
    } catch (err) {
      setLinkMessage({
        type: "error",
        text: err instanceof Error ? err.message : "LINE連携に失敗しました",
      });
    } finally {
      setIsLinking(false);
    }
  };

  // ログアウト
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();

      // Cookie削除
      document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      // LIFF初期化済みの場合はLINEもログアウト
      try {
        if (isLiffInitialized() && liff.isLoggedIn()) {
          liff.logout();
        }
      } catch {
        // LIFFログアウト失敗は無視
      }

      window.location.href = "/login";
    } catch {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return <LoadingOverlay text="読み込み中..." />;
  }

  const notifyItems = [
    {
      key: "schedule" as const,
      label: "スケジュール通知",
      value: notificationSettings.schedule,
    },
    {
      key: "post" as const,
      label: "連絡通知",
      value: notificationSettings.post,
    },
    {
      key: "accounting" as const,
      label: "会計通知",
      value: notificationSettings.accounting,
    },
  ];

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">マイページ</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* プロフィール */}
        <Card>
          <CardHeader>
            <CardTitle>プロフィール</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="プロフィール画像"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <Input
                  label="表示名"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <Input
                  label="電話番号"
                  type="tel"
                  placeholder="090-1234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            {profileMessage && (
              <div
                className={`mt-3 rounded-lg p-2 text-xs ${
                  profileMessage.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {profileMessage.text}
              </div>
            )}
            <Button
              className="mt-3 w-full"
              variant="outline"
              onClick={handleSaveProfile}
              disabled={isSavingProfile || !displayName.trim()}
            >
              {isSavingProfile ? "保存中..." : "保存"}
            </Button>
          </CardContent>
        </Card>

        {/* お子さまの情報 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>お子さまの情報</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowAddChild(true);
                  if (myTeams.length === 1) {
                    setAddChildForm((prev) => ({
                      ...prev,
                      teamId: myTeams[0].team.id,
                    }));
                  }
                }}
              >
                + 追加
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {children.length === 0 ? (
              <p className="text-sm text-gray-500">
                お子さまの情報はまだ登録されていません
              </p>
            ) : (
              <div className="space-y-2">
                {children.map((child) => (
                  <div
                    key={child.user_child_id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <PlayerAvatar player={child.player} size="lg" showNumber />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {child.player.name}
                        </p>
                      <p className="text-xs text-gray-500">
                        {child.player.grade
                          ? `${child.player.grade}年生`
                          : ""}
                        {child.player.number != null
                          ? ` · 背番号 ${child.player.number}`
                          : ""}
                        {child.player.position
                          ? ` · ${child.player.position}`
                          : ""}
                        {child.player.throwing_hand || child.player.batting_hand
                          ? ` · ${child.player.throwing_hand || ""}${child.player.batting_hand || ""}`
                          : ""}
                      </p>
                      <p className="text-xs text-gray-400">{child.team_name}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartEditChild(child)}
                    >
                      編集
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* 子供追加フォーム */}
            {showAddChild && (
              <div className="mt-4 space-y-3 rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-medium text-gray-900">
                  お子さまを追加
                </h4>
                {myTeams.length > 1 && (
                  <Select
                    id="add-child-team"
                    label="所属チーム"
                    options={myTeams.map((t) => ({
                      value: t.team.id,
                      label: t.team.name,
                    }))}
                    value={addChildForm.teamId}
                    onChange={(e) =>
                      setAddChildForm({ ...addChildForm, teamId: e.target.value })
                    }
                    placeholder="チームを選択"
                  />
                )}
                <Input
                  label="氏名"
                  placeholder="お子さまの名前"
                  value={addChildForm.name}
                  onChange={(e) =>
                    setAddChildForm({ ...addChildForm, name: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="背番号"
                    type="number"
                    placeholder="7"
                    value={addChildForm.number}
                    onChange={(e) =>
                      setAddChildForm({ ...addChildForm, number: e.target.value })
                    }
                  />
                  <Input
                    label="学年"
                    type="number"
                    placeholder="4"
                    value={addChildForm.grade}
                    onChange={(e) =>
                      setAddChildForm({ ...addChildForm, grade: e.target.value })
                    }
                  />
                </div>
                <Select
                  id="add-child-position"
                  label="ポジション"
                  options={POSITION_OPTIONS}
                  value={addChildForm.position}
                  onChange={(e) =>
                    setAddChildForm({ ...addChildForm, position: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    id="add-child-throwing"
                    label="投"
                    options={THROWING_OPTIONS}
                    value={addChildForm.throwing_hand}
                    onChange={(e) =>
                      setAddChildForm({
                        ...addChildForm,
                        throwing_hand: e.target.value,
                      })
                    }
                  />
                  <Select
                    id="add-child-batting"
                    label="打"
                    options={BATTING_OPTIONS}
                    value={addChildForm.batting_hand}
                    onChange={(e) =>
                      setAddChildForm({
                        ...addChildForm,
                        batting_hand: e.target.value,
                      })
                    }
                  />
                </div>
                <Select
                  id="add-child-relationship"
                  label="お子さまとの関係"
                  options={RELATIONSHIP_OPTIONS}
                  value={addChildForm.relationship}
                  onChange={(e) =>
                    setAddChildForm({
                      ...addChildForm,
                      relationship: e.target.value,
                    })
                  }
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowAddChild(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleAddChild}
                    disabled={
                      isAddingChild ||
                      !addChildForm.name.trim() ||
                      !addChildForm.teamId
                    }
                  >
                    {isAddingChild ? "追加中..." : "追加"}
                  </Button>
                </div>
              </div>
            )}

            {/* 子供編集フォーム */}
            {editingChild && (
              <div className="mt-4 space-y-3 rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-medium text-gray-900">
                  {editingChild.player.name} を編集
                </h4>
                <div className="flex justify-center">
                  <PlayerPhotoUpload
                    player={editingChild.player}
                    size="lg"
                    onUpload={async (file) => {
                      await uploadPlayerPhoto(
                        file,
                        editingChild.team_id,
                        editingChild.player.id
                      );
                      if (userId) await fetchData(userId);
                    }}
                  />
                </div>
                <Input
                  label="氏名"
                  value={editChildForm.name}
                  onChange={(e) =>
                    setEditChildForm({ ...editChildForm, name: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="背番号"
                    type="number"
                    value={editChildForm.number}
                    onChange={(e) =>
                      setEditChildForm({
                        ...editChildForm,
                        number: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="学年"
                    type="number"
                    value={editChildForm.grade}
                    onChange={(e) =>
                      setEditChildForm({
                        ...editChildForm,
                        grade: e.target.value,
                      })
                    }
                  />
                </div>
                <Select
                  id="edit-child-position"
                  label="ポジション"
                  options={POSITION_OPTIONS}
                  value={editChildForm.position}
                  onChange={(e) =>
                    setEditChildForm({
                      ...editChildForm,
                      position: e.target.value,
                    })
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    id="edit-child-throwing"
                    label="投"
                    options={THROWING_OPTIONS}
                    value={editChildForm.throwing_hand}
                    onChange={(e) =>
                      setEditChildForm({
                        ...editChildForm,
                        throwing_hand: e.target.value,
                      })
                    }
                  />
                  <Select
                    id="edit-child-batting"
                    label="打"
                    options={BATTING_OPTIONS}
                    value={editChildForm.batting_hand}
                    onChange={(e) =>
                      setEditChildForm({
                        ...editChildForm,
                        batting_hand: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEditingChild(null)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSaveChild}
                    disabled={isSavingChild || !editChildForm.name.trim()}
                  >
                    {isSavingChild ? "保存中..." : "保存"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* チーム切替 */}
        <Card>
          <CardHeader>
            <CardTitle>所属チーム</CardTitle>
          </CardHeader>
          <CardContent>
            {myTeams.length === 0 ? (
              <p className="text-sm text-gray-500">
                所属チームがありません
              </p>
            ) : (
              <div className="space-y-2">
                {myTeams.map((t) => {
                  const isCurrent = currentTeam?.id === t.team.id;
                  return (
                    <div
                      key={t.member_id}
                      className={`flex items-center justify-between rounded-lg p-3 ${
                        isCurrent
                          ? "border border-green-200 bg-green-50"
                          : "bg-gray-50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {t.team.name}
                          </p>
                          {isCurrent && <Badge variant="primary">現在</Badge>}
                        </div>
                        <p className="text-xs text-gray-500">
                          {getRoleLabel(t.permission_group)}
                          {t.is_admin && " ⚙サイト管理者"}
                        </p>
                      </div>
                      {!isCurrent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => switchTeam(t.team.id)}
                        >
                          切替
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 通知設定 */}
        <Card>
          <CardHeader>
            <CardTitle>通知設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifyItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <button
                    onClick={() => handleToggleNotification(item.key)}
                    disabled={isSavingNotification}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      item.value ? "bg-green-600" : "bg-gray-300"
                    } ${isSavingNotification ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        item.value ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* メニュー */}
        <Link href="/mypage/payments">
          <Card className="p-4 transition-colors hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                マイ支払い
              </span>
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </div>
          </Card>
        </Link>

        {/* LINE連携 */}
        <Card>
          <CardHeader>
            <CardTitle>LINE連携</CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.line_id ? (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                LINE連携済み
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  LINEと連携すると、LINEからもログインできるようになります
                </p>
                {linkMessage && (
                  <div
                    className={`rounded-lg p-2 text-xs ${
                      linkMessage.type === "success"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {linkMessage.text}
                  </div>
                )}
                <Button
                  variant="line"
                  className="w-full"
                  onClick={handleLinkLine}
                  disabled={isLinking}
                >
                  {isLinking ? "連携中..." : "LINEと連携する"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ログアウト */}
        <div className="py-4">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full text-center text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            {isLoggingOut ? "ログアウト中..." : "ログアウト"}
          </button>
        </div>
      </div>
    </div>
  );
}
