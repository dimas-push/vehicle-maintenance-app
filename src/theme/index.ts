export const colors = {
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  primarySoft: "#eff6ff",

  background: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",

  text: "#0f172a",
  textMuted: "#64748b",
  textSubtle: "#94a3b8",

  success: "#16a34a",
  successSoft: "#f0fdf4",
  warning: "#d97706",
  warningSoft: "#fffbeb",
  danger: "#dc2626",
  dangerSoft: "#fef2f2",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 20, fontWeight: "700" as const, color: colors.text },
  subtitle: { fontSize: 15, fontWeight: "500" as const, color: colors.textMuted },
  body: { fontSize: 15, color: colors.text },
  label: { fontSize: 13, fontWeight: "600" as const, color: colors.textMuted },
  caption: { fontSize: 12, color: colors.textSubtle },
};

export const shadow = {
  card: {
    boxShadow: "0px 1px 8px rgba(15, 23, 42, 0.06)",
    elevation: 2,
  },
} as const;
