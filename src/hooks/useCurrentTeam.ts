"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Team, TeamWithRole, PermissionGroup } from "@/types";

const CURRENT_TEAM_KEY = "currentTeamId";

function getStoredTeamId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_TEAM_KEY);
}

function setStoredTeamId(teamId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CURRENT_TEAM_KEY, teamId);
}

export function useCurrentTeam() {
  const [teams, setTeams] = useState<TeamWithRole[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [currentMembership, setCurrentMembership] = useState<TeamWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTeams = useCallback(async (retryCount = 0) => {
    try {
      // セッション復元を待つ: getSession() で現在のセッションを確認
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData.session?.user;
      console.log("useCurrentTeam - session user:", sessionUser?.id ?? "null", "retryCount:", retryCount);

      if (!sessionUser) {
        // セッション未確立の場合、リトライ（ページリロード直後のタイミング対策）
        if (retryCount < 3) {
          console.log(`useCurrentTeam - セッション未確立、${retryCount + 1}回目のリトライ (1秒後)`);
          setTimeout(() => fetchTeams(retryCount + 1), 1000);
          return; // isLoading は true のまま維持
        }
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("team_members")
        .select("id, permission_group, is_admin, teams(*)")
        .eq("user_id", sessionUser.id)
        .eq("is_active", true);

      console.log("useCurrentTeam - query result:", { dataCount: data?.length, error });

      if (error) throw error;

      const teamList: TeamWithRole[] = (data || []).map(
        (row: Record<string, unknown>) => ({
          team: row.teams as Team,
          permission_group: row.permission_group as PermissionGroup,
          is_admin: (row.is_admin as boolean) ?? false,
          member_id: row.id as string,
        })
      );

      // チーム作成直後のタイミング問題対策: 結果が空で再試行回数が残っている場合リトライ
      if (teamList.length === 0 && retryCount < 3) {
        console.log(`useCurrentTeam - チーム未検出、${retryCount + 1}回目のリトライ (1秒後)`);
        setTimeout(() => fetchTeams(retryCount + 1), 1000);
        return; // isLoading は true のまま維持
      }

      setTeams(teamList);

      // 現在のチームを決定
      const storedId = getStoredTeamId();
      const found = teamList.find((t) => t.team.id === storedId);
      if (found) {
        setCurrentTeam(found.team);
        setCurrentMembership(found);
      } else if (teamList.length > 0) {
        setCurrentTeam(teamList[0].team);
        setCurrentMembership(teamList[0]);
        setStoredTeamId(teamList[0].team.id);
      }
      setIsLoading(false);
    } catch (err) {
      console.error("チーム一覧取得エラー:", err);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    fetchTeams();
  }, [fetchTeams]);

  return {
    currentTeam,
    currentMembership,
    teams,
    isLoading,
    refetch,
  };
}
