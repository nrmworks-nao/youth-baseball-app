"use client";

import { useCallback } from "react";
import type { PermissionGroup } from "@/types";

/**
 * 権限チェック用フック
 * permission_group で役割判定、is_admin でサイト管理者判定を行う
 */
export function usePermission(
  currentPermission: PermissionGroup | null,
  isAdminFlag: boolean = false
) {
  // 指定された権限グループのいずれかに該当するかチェック
  // サイト管理者(is_admin)は全権限を持つ
  const hasPermission = useCallback(
    (allowedGroups: PermissionGroup[]): boolean => {
      if (!currentPermission) return false;
      if (isAdminFlag) return true;
      return allowedGroups.includes(currentPermission);
    },
    [currentPermission, isAdminFlag]
  );

  // サイト管理者かどうか
  const isAdmin = useCallback((): boolean => {
    return isAdminFlag;
  }, [isAdminFlag]);

  // 投稿権限があるか
  const canPost = useCallback((): boolean => {
    return hasPermission([
      "director",
      "vice_president",
      "coach",
      "publicity",
    ]);
  }, [hasPermission]);

  // イベント作成権限があるか
  const canCreateEvent = useCallback((): boolean => {
    return hasPermission(["director", "vice_president", "coach"]);
  }, [hasPermission]);

  // 権限レベルの取得（数値が小さいほど強い権限）
  const getPermissionLevel = useCallback((): number => {
    if (!currentPermission) return 8;
    if (isAdminFlag) return 0;
    const hierarchy: PermissionGroup[] = [
      "director",
      "president",
      "vice_president",
      "captain",
      "coach",
      "treasurer",
      "publicity",
      "parent",
    ];
    const index = hierarchy.indexOf(currentPermission);
    return index === -1 ? 8 : index + 1;
  }, [currentPermission, isAdminFlag]);

  // 会計管理権限（会費設定・請求作成）
  const canManageAccounting = useCallback((): boolean => {
    return hasPermission(["director", "vice_president", "treasurer"]);
  }, [hasPermission]);

  // 入金記録権限
  const canRecordPayment = useCallback((): boolean => {
    return hasPermission(["vice_president", "treasurer"]);
  }, [hasPermission]);

  // 収支台帳閲覧権限
  const canViewLedger = useCallback((): boolean => {
    return hasPermission(["director", "vice_president", "treasurer"]);
  }, [hasPermission]);

  // アルバム管理権限（写真削除・報告対応）
  const canManagePhotos = useCallback((): boolean => {
    return hasPermission([
      "director",
      "vice_president",
      "coach",
      "publicity",
    ]);
  }, [hasPermission]);

  // 写真アップロード権限
  const canUploadPhotos = useCallback((): boolean => {
    return hasPermission([
      "director",
      "publicity",
      "parent",
    ]);
  }, [hasPermission]);

  // ショップ管理権限（is_adminのみ）
  const canManageShop = useCallback((): boolean => {
    return isAdminFlag;
  }, [isAdminFlag]);

  // おすすめピン留め権限
  const canPinProduct = useCallback((): boolean => {
    return hasPermission(["director", "vice_president"]);
  }, [hasPermission]);

  // チーム間メッセージ送受信権限
  const canSendInterTeamMessage = useCallback((): boolean => {
    return hasPermission(["director", "vice_president"]);
  }, [hasPermission]);

  // 練習試合申込権限
  const canRequestMatch = useCallback((): boolean => {
    return hasPermission(["director", "vice_president", "coach"]);
  }, [hasPermission]);

  return {
    currentPermission,
    isAdminFlag,
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
