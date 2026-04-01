export const ROLE_LABELS: Record<string, string> = {
  system_admin: "システム管理者",
  team_admin: "チーム管理者",
  director: "監督",
  president: "会長",
  vice_president: "副会長",
  captain: "部長",
  coach: "コーチ",
  treasurer: "会計",
  manager: "マネージャー",
  publicity: "広報",
  parent: "保護者",
};

export const getRoleLabel = (permissionGroup: string): string => {
  return ROLE_LABELS[permissionGroup] || permissionGroup;
};
