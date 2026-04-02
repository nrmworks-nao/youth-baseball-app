"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay, EmptyState } from "@/components/ui/error-display";
import { Badge } from "@/components/ui/badge";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { getPlayers } from "@/lib/supabase/queries/players";
import { getStaffMembers } from "@/lib/supabase/queries/members";
import { getRoleLabel } from "@/lib/utils/roles";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import type { Player, StaffMember, PermissionGroup } from "@/types";

type Tab = "players" | "staff";
type SortDirection = "asc" | "desc";

// スタッフ役割フィルタ一覧
const STAFF_ROLES: PermissionGroup[] = [
  "director", "president", "vice_president", "captain", "coach", "treasurer", "publicity",
];

// 役割ソート順
const ROLE_SORT_ORDER: Record<string, number> = {
  director: 0,
  president: 1,
  vice_president: 2,
  captain: 3,
  coach: 4,
  treasurer: 5,
  publicity: 6,
};

// ソートオプション
type PlayerSortKey = "grade" | "number" | "name";
type StaffSortKey = "role" | "name";

// 学年フィルタ固定リスト
const GRADES = [1, 2, 3, 4, 5, 6];

// ポジションフィルタ2段表示
const POSITIONS_ROW1 = ["全て", "投手", "捕手", "一塁手", "二塁手", "三塁手"];
const POSITIONS_ROW2 = ["遊撃手", "左翼手", "中堅手", "右翼手"];

export default function MembersPage() {
  const [activeTab, setActiveTab] = useState<Tab>("players");
  const [searchQuery, setSearchQuery] = useState("");

  // 選手フィルタ・ソート
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [filterGrade, setFilterGrade] = useState<number | null>(null);
  const [playerSort1, setPlayerSort1] = useState<PlayerSortKey>("grade");
  const [playerSort2, setPlayerSort2] = useState<PlayerSortKey>("name");
  const [playerSort1Dir, setPlayerSort1Dir] = useState<SortDirection>("asc");
  const [playerSort2Dir, setPlayerSort2Dir] = useState<SortDirection>("asc");

  // スタッフフィルタ・ソート
  const [filterRole, setFilterRole] = useState<string>("all");
  const [staffSort1, setStaffSort1] = useState<StaffSortKey>("role");
  const [staffSort2, setStaffSort2] = useState<StaffSortKey>("name");
  const [staffSort1Dir, setStaffSort1Dir] = useState<SortDirection>("asc");
  const [staffSort2Dir, setStaffSort2Dir] = useState<SortDirection>("asc");

  // データ
  const [players, setPlayers] = useState<Player[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentTeam, isLoading: teamLoading } = useCurrentTeam();

  const loadData = useCallback(async () => {
    if (!currentTeam) return;
    setIsLoading(true);
    setError(null);
    try {
      // 分割クエリパターン: players, team_members, users を個別取得してマージ
      const [playerList, staffList] = await Promise.all([
        getPlayers(currentTeam.id),
        getStaffMembers(currentTeam.id),
      ]);

      setPlayers(playerList.filter((p) => p.is_active));

      // スタッフのuser_idを収集してusers情報を取得
      const userIds = staffList.map((m) => m.user_id);
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, display_name, avatar_url")
          .in("id", userIds);

        const usersMap = new Map(
          (usersData || []).map((u: { id: string; display_name: string; avatar_url?: string }) => [u.id, u])
        );

        const merged: StaffMember[] = staffList.map((m) => {
          const user = usersMap.get(m.user_id);
          return {
            id: m.id,
            team_id: m.team_id,
            user_id: m.user_id,
            permission_group: m.permission_group,
            is_admin: m.is_admin,
            experience: m.experience,
            motivation: m.motivation,
            display_name: user?.display_name || "名前未設定",
            avatar_url: user?.avatar_url,
          };
        });
        setStaffMembers(merged);
      } else {
        setStaffMembers([]);
      }
    } catch {
      setError("データの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  useEffect(() => {
    if (teamLoading || !currentTeam) return;
    loadData();
  }, [currentTeam, teamLoading, loadData]);

  // 選手ソート関数
  const sortPlayers = useCallback((a: Player, b: Player, key: PlayerSortKey, dir: SortDirection): number => {
    const mul = dir === "asc" ? 1 : -1;
    if (key === "grade") return mul * ((a.grade ?? 0) - (b.grade ?? 0));
    if (key === "number") return mul * ((a.number ?? 999) - (b.number ?? 999));
    return mul * a.name.localeCompare(b.name, "ja");
  }, []);

  // スタッフソート関数
  const sortStaff = useCallback((a: StaffMember, b: StaffMember, key: StaffSortKey, dir: SortDirection): number => {
    const mul = dir === "asc" ? 1 : -1;
    if (key === "role") return mul * ((ROLE_SORT_ORDER[a.permission_group] ?? 99) - (ROLE_SORT_ORDER[b.permission_group] ?? 99));
    return mul * a.display_name.localeCompare(b.display_name, "ja");
  }, []);

  // フィルタ・ソート済み選手
  const filteredPlayers = useMemo(() => {
    let list = [...players];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (filterPosition !== "all") {
      list = list.filter((p) => p.position === filterPosition);
    }
    if (filterGrade !== null) {
      list = list.filter((p) => p.grade === filterGrade);
    }
    list.sort((a, b) => {
      const c = sortPlayers(a, b, playerSort1, playerSort1Dir);
      return c !== 0 ? c : sortPlayers(a, b, playerSort2, playerSort2Dir);
    });
    return list;
  }, [players, searchQuery, filterPosition, filterGrade, playerSort1, playerSort2, playerSort1Dir, playerSort2Dir, sortPlayers]);

  // フィルタ・ソート済みスタッフ
  const filteredStaff = useMemo(() => {
    let list = [...staffMembers];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) => s.display_name.toLowerCase().includes(q));
    }
    if (filterRole !== "all") {
      list = list.filter((s) => s.permission_group === filterRole);
    }
    list.sort((a, b) => {
      const c = sortStaff(a, b, staffSort1, staffSort1Dir);
      return c !== 0 ? c : sortStaff(a, b, staffSort2, staffSort2Dir);
    });
    return list;
  }, [staffMembers, searchQuery, filterRole, staffSort1, staffSort2, staffSort1Dir, staffSort2Dir, sortStaff]);

  if (teamLoading || isLoading) return <Loading className="min-h-screen" />;
  if (error) return <ErrorDisplay message={error} onRetry={loadData} />;

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">メンバー</h2>
      </div>

      {/* 検索バー */}
      <div className="bg-white px-4 py-2 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="名前で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          />
        </div>
      </div>

      {/* タブ切り替え */}
      <div className="flex bg-white border-b border-gray-200">
        <button
          onClick={() => setActiveTab("players")}
          className={cn(
            "flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors",
            activeTab === "players"
              ? "border-green-600 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          選手 ({players.length})
        </button>
        <button
          onClick={() => setActiveTab("staff")}
          className={cn(
            "flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors",
            activeTab === "staff"
              ? "border-green-600 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          スタッフ ({staffMembers.length})
        </button>
      </div>

      {/* 選手タブ */}
      {activeTab === "players" && (
        <>
          {/* フィルタ・ソート */}
          <div className="space-y-2 bg-white px-4 py-3 border-b border-gray-100">
            {/* ソート */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex-shrink-0 text-xs text-gray-500">第1ソート:</span>
              <select
                value={playerSort1}
                onChange={(e) => setPlayerSort1(e.target.value as PlayerSortKey)}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:border-green-500 focus:outline-none"
              >
                <option value="grade">学年</option>
                <option value="number">背番号</option>
                <option value="name">名前</option>
              </select>
              <Button
                variant={playerSort1Dir === "asc" ? "default" : "outline"}
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setPlayerSort1Dir("asc")}
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant={playerSort1Dir === "desc" ? "default" : "outline"}
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setPlayerSort1Dir("desc")}
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
              <span className="flex-shrink-0 text-xs text-gray-500">第2ソート:</span>
              <select
                value={playerSort2}
                onChange={(e) => setPlayerSort2(e.target.value as PlayerSortKey)}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:border-green-500 focus:outline-none"
              >
                <option value="name">名前</option>
                <option value="grade">学年</option>
                <option value="number">背番号</option>
              </select>
              <Button
                variant={playerSort2Dir === "asc" ? "default" : "outline"}
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setPlayerSort2Dir("asc")}
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant={playerSort2Dir === "desc" ? "default" : "outline"}
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setPlayerSort2Dir("desc")}
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>

            {/* ポジションフィルター（2段表示） */}
            <div className="space-y-1">
              <span className="text-xs text-gray-500">ポジション:</span>
              <div className="flex gap-1 flex-wrap">
                {POSITIONS_ROW1.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setFilterPosition(pos === "全て" ? "all" : pos)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                      (pos === "全て" ? filterPosition === "all" : filterPosition === pos)
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {pos}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 flex-wrap">
                {POSITIONS_ROW2.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setFilterPosition(pos)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                      filterPosition === pos ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* 学年フィルター（固定1〜6年） */}
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 text-xs text-gray-500">学年:</span>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setFilterGrade(null)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    filterGrade === null ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
                  )}
                >
                  全て
                </button>
                {GRADES.map((g) => (
                  <button
                    key={g}
                    onClick={() => setFilterGrade(g)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                      filterGrade === g ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {g}年
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 選手カード一覧 */}
          {filteredPlayers.length === 0 ? (
            <EmptyState
              title="該当する選手がいません"
              description="条件を変更してみてください"
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 p-4">
              {filteredPlayers.map((player) => (
                <Link key={player.id} href={`/players/${player.id}`}>
                  <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-3 transition-transform active:scale-[0.98]">
                    <div className="flex items-center gap-3">
                      {/* 顔写真 */}
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 border-gray-100 bg-gray-200 shadow-sm">
                        {player.card_photo_url ? (
                          <img
                            src={player.card_photo_url}
                            alt={player.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-400">
                            {player.number ?? "?"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-gray-900 truncate block">
                          {player.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {player.number !== undefined && <span>#{player.number}</span>}
                          {player.position && <span>{player.position}</span>}
                          {player.grade && <span>{player.grade}年</span>}
                        </div>
                      </div>
                      <svg
                        className="h-4 w-4 flex-shrink-0 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* スタッフタブ */}
      {activeTab === "staff" && (
        <>
          {/* フィルタ・ソート */}
          <div className="space-y-2 bg-white px-4 py-3 border-b border-gray-100">
            {/* ソート */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex-shrink-0 text-xs text-gray-500">第1ソート:</span>
              <select
                value={staffSort1}
                onChange={(e) => setStaffSort1(e.target.value as StaffSortKey)}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:border-green-500 focus:outline-none"
              >
                <option value="role">役割</option>
                <option value="name">名前</option>
              </select>
              <Button
                variant={staffSort1Dir === "asc" ? "default" : "outline"}
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setStaffSort1Dir("asc")}
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant={staffSort1Dir === "desc" ? "default" : "outline"}
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setStaffSort1Dir("desc")}
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
              <span className="flex-shrink-0 text-xs text-gray-500">第2ソート:</span>
              <select
                value={staffSort2}
                onChange={(e) => setStaffSort2(e.target.value as StaffSortKey)}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:border-green-500 focus:outline-none"
              >
                <option value="name">名前</option>
                <option value="role">役割</option>
              </select>
              <Button
                variant={staffSort2Dir === "asc" ? "default" : "outline"}
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setStaffSort2Dir("asc")}
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant={staffSort2Dir === "desc" ? "default" : "outline"}
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setStaffSort2Dir("desc")}
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>

            {/* 役割フィルター */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="flex-shrink-0 text-xs text-gray-500">役割:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setFilterRole("all")}
                  className={cn(
                    "flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    filterRole === "all" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
                  )}
                >
                  全て
                </button>
                {STAFF_ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => setFilterRole(role)}
                    className={cn(
                      "flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                      filterRole === role ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {getRoleLabel(role)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* スタッフカード一覧 */}
          {filteredStaff.length === 0 ? (
            <EmptyState
              title="該当するスタッフがいません"
              description="条件を変更してみてください"
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 p-4">
              {filteredStaff.map((staff) => (
                <Link key={staff.id} href={`/members/staff/${staff.id}`}>
                  <div className="relative overflow-hidden rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100 p-3 transition-transform active:scale-[0.98]">
                    {/* 光沢エフェクト */}
                    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rotate-45 bg-gradient-to-br from-blue-200/50 to-transparent opacity-60" />

                    <div className="flex items-center gap-3">
                      {/* プロフィール写真 */}
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 border-white bg-gray-200 shadow-sm">
                        {staff.avatar_url ? (
                          <img
                            src={staff.avatar_url}
                            alt={staff.display_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-400">
                            {staff.display_name.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-bold text-gray-900 truncate">
                            {staff.display_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-[10px]">
                            {getRoleLabel(staff.permission_group)}
                          </Badge>
                          {staff.is_admin && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                              ⚙サイト管理者
                            </span>
                          )}
                        </div>
                      </div>

                      <svg
                        className="h-4 w-4 flex-shrink-0 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
