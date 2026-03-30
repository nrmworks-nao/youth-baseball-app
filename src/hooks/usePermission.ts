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

  // 会計管理権限（会費設定・請求作成）
  const canManageAccounting = useCallback((): boolean => {
    return hasPermission(["team_admin", "vice_president", "treasurer"]);
  }, [hasPermission]);

  // 入金記録権限
  const canRecordPayment = useCallback((): boolean => {
    return hasPermission(["vice_president", "treasurer"]);
  }, [hasPermission]);

  // 収支台帳閲覧権限
  const canViewLedger = useCallback((): boolean => {
    return hasPermission(["team_admin", "vice_president", "treasurer"]);
  }, [hasPermission]);

  // アルバム管理権限（写真削除・報告対応）
  const canManagePhotos = useCallback((): boolean => {
    return hasPermission([
      "team_admin",
      "vice_president",
      "manager",
      "publicity",
    ]);
  }, [hasPermission]);

  // 写真アップロード権限
  const canUploadPhotos = useCallback((): boolean => {
    return hasPermission([
      "team_admin",
      "publicity",
      "parent",
    ]);
  }, [hasPermission]);

  // ショップ管理権限（system_adminのみ）
  const canManageShop = useCallback((): boolean => {
    return hasPermission([]);
    // system_admin はhasPermission内で常にtrueなので、空配列でsystem_adminのみに制限
  }, [hasPermission]);

  // おすすめピン留め権限
  const canPinProduct = useCallback((): boolean => {
    return hasPermission(["team_admin", "vice_president"]);
  }, [hasPermission]);

  // チーム間メッセージ送受信権限
  const canSendInterTeamMessage = useCallback((): boolean => {
    return hasPermission(["team_admin", "vice_president"]);
  }, [hasPermission]);

  // 練習試合申込権限
  const canRequestMatch = useCallback((): boolean => {
    return hasPermission(["team_admin", "vice_president", "manager"]);
  }, [hasPermission]);

  return {
    currentPermission,
    hasPermission,
    isAdmin,
    canPost,
    canCreateEvent,
    getPermissionLevel,
    canManageAccounting,
    canRecordPayment,
    canViewLedger,
    canManagePhotos,
    canUploadPhotos,
    canManageShop,
    canPinProduct,
    canSendInterTeamMessage,
    canRequestMatch,
  };
}
