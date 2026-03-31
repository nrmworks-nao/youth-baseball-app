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

  const fetchTeams = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("team_members")
        .select("id, permission_group, display_title, teams(*)")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) throw error;

      const teamList: TeamWithRole[] = (data || []).map(
        (row: Record<string, unknown>) => ({
          team: row.teams as Team,
          permission_group: row.permission_group as PermissionGroup,
          display_title: row.display_title as string,
          member_id: row.id as string,
        })
      );

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
    } catch (err) {
      console.error("チーム一覧取得エラー:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const switchTeam = useCallback(
    (teamId: string) => {
      const found = teams.find((t) => t.team.id === teamId);
      if (found) {
        setCurrentTeam(found.team);
        setCurrentMembership(found);
        setStoredTeamId(teamId);
        // ページをリロードして切り替え先チームのデータを反映
        window.location.reload();
      }
    },
    [teams]
  );

  const refetch = useCallback(() => {
    setIsLoading(true);
    fetchTeams();
  }, [fetchTeams]);

  return {
    currentTeam,
    currentMembership,
    teams,
    switchTeam,
    isLoading,
    refetch,
  };
}
