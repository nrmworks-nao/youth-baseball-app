"use client";

import { useCallback } from "react";
import type { PermissionGroup } from "@/types";

// 権限の階層（上位ほど強い権限）
const PERMISSION_HIERARCHY: PermissionGroup[] = [
  "system_admin",
  "team_admin",
  "vice_president",
  "treasurer",
  "manager",
  "publicity",
  "parent",
];

/**
 * 権限チェック用フック
 * permission_group で判定を行う
 */
export function usePermission(currentPermission: PermissionGroup | null) {
  // 指定された権限グループのいずれかに該当するかチェック
  const hasPermission = useCallback(
    (allowedGroups: PermissionGroup[]): boolean => {
      if (!currentPermission) return false;
      if (currentPermission === "system_admin") return true;
      return allowedGroups.includes(currentPermission);
    },
    [currentPermission]
  );

  // 管理者権限かどうか
  const isAdmin = useCallback((): boolean => {
    return hasPermission(["team_admin"]);
  }, [hasPermission]);

  // 投稿権限があるか
  const canPost = useCallback((): boolean => {
    return hasPermission([
      "team_admin",
      "vice_president",
      "manager",
      "publicity",
    ]);
  }, [hasPermission]);

  // イベント作成権限があるか
  const canCreateEvent = useCallback((): boolean => {
    return hasPermission(["team_admin", "vice_president", "manager"]);
  }, [hasPermission]);

  // 権限レベルの取得（数値が小さいほど強い権限）
  const getPermissionLevel = useCallback((): number => {
    if (!currentPermission) return PERMISSION_HIERARCHY.length;
    const index = PERMISSION_HIERARCHY.indexOf(currentPermission);
    return index === -1 ? PERMISSION_HIERARCHY.length : index;
  }, [currentPermission]);

  return {
    currentPermission,
    hasPermission,
    isAdmin,
    canPost,
    canCreateEvent,
    getPermissionLevel,
  };
}
