export const ROLE_LABELS: Record<string, string> = {
  director: '監督',
  president: '会長',
  vice_president: '副会長',
  captain: '部長',
  coach: 'コーチ',
  treasurer: '会計',
  publicity: '広報',
  parent: '保護者',
};

export const getRoleLabel = (permissionGroup: string): string => {
  return ROLE_LABELS[permissionGroup] || permissionGroup;
};

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value,
  label,
}));
