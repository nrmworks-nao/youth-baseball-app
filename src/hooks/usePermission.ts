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

  // メンバー管理権限
  const canManageMembers = useCallback((): boolean => {
    return hasPermission(["director", "president", "vice_president"]);
  }, [hasPermission]);

  // イベント作成権限
  const canCreateEvents = useCallback((): boolean => {
    return hasPermission(["director", "captain", "coach"]);
  }, [hasPermission]);

  // 投稿権限（保護者以外全員）
  const canPostAnnouncements = useCallback((): boolean => {
    if (!currentPermission) return false;
    if (isAdminFlag) return true;
    return currentPermission !== "parent";
  }, [currentPermission, isAdminFlag]);

  // スコアブック管理権限
  const canManageScorebook = useCallback((): boolean => {
    return hasPermission(["director", "coach"]);
  }, [hasPermission]);

  // 全成績閲覧権限
  const canViewAllStats = useCallback((): boolean => {
    return hasPermission(["director", "coach"]);
  }, [hasPermission]);

  // 測定入力権限
  const canInputMeasurements = useCallback((): boolean => {
    return hasPermission(["director", "coach"]);
  }, [hasPermission]);

  // アルバム管理権限
  const canManageAlbums = useCallback((): boolean => {
    return hasPermission(["director", "president", "captain", "coach", "publicity"]);
  }, [hasPermission]);

  // チーム間管理権限
  const canManageInterTeam = useCallback((): boolean => {
    return hasPermission(["director", "president", "vice_president"]);
  }, [hasPermission]);

  // 会費管理権限
  const canManageFees = useCallback((): boolean => {
    return hasPermission(["president", "vice_president", "treasurer"]);
  }, [hasPermission]);

  // 入金記録権限
  const canRecordPayments = useCallback((): boolean => {
    return hasPermission(["president", "treasurer"]);
  }, [hasPermission]);

  // 収支台帳閲覧権限
  const canViewLedger = useCallback((): boolean => {
    return hasPermission(["director", "president", "vice_president", "treasurer"]);
  }, [hasPermission]);

  // 表彰作成権限
  const canCreateAwards = useCallback((): boolean => {
    return hasPermission(["director", "coach"]);
  }, [hasPermission]);

  // チームチャレンジ作成権限
  const canCreateTeamChallenge = useCallback((): boolean => {
    return hasPermission(["director"]);
  }, [hasPermission]);

  // 設定管理権限（is_adminのみ）
  const canManageSettings = useCallback((): boolean => {
    return isAdminFlag;
  }, [isAdminFlag]);

  // メンバーページ管理権限
  const canManageMembersPage = useCallback((): boolean => {
    return hasPermission(["director", "president", "vice_president"]);
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

  // --- 後方互換（既存コードで使用中） ---

  // 投稿権限（canPostAnnouncements のエイリアス）
  const canPost = canPostAnnouncements;

  // イベント作成権限（canCreateEvents のエイリアス）
  const canCreateEvent = canCreateEvents;

  // 会計管理権限
  const canManageAccounting = useCallback((): boolean => {
    return canViewLedger() || canManageFees();
  }, [canViewLedger, canManageFees]);

  // 入金記録権限（canRecordPayments のエイリアス）
  const canRecordPayment = canRecordPayments;

  // アルバム管理権限（canManageAlbums のエイリアス）
  const canManagePhotos = canManageAlbums;

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
    return canManageInterTeam();
  }, [canManageInterTeam]);

  // 練習試合申込権限
  const canRequestMatch = useCallback((): boolean => {
    return canManageInterTeam();
  }, [canManageInterTeam]);

  return {
    currentPermission,
    isAdminFlag,
    hasPermission,
    isAdmin,
    // 新しい権限チェック
    canManageMembers,
    canCreateEvents,
    canPostAnnouncements,
    canManageScorebook,
    canViewAllStats,
    canInputMeasurements,
    canManageAlbums,
    canManageInterTeam,
    canManageFees,
    canRecordPayments,
    canViewLedger,
    canCreateAwards,
    canCreateTeamChallenge,
    canManageSettings,
    canManageMembersPage,
    // 後方互換
    canPost,
    canCreateEvent,
    getPermissionLevel,
    canManageAccounting,
    canRecordPayment,
    canManagePhotos,
    canUploadPhotos,
    canManageShop,
    canPinProduct,
    canSendInterTeamMessage,
    canRequestMatch,
  };
}
