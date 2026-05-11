export type AppMode = "runner" | "verifier";

/** Pre-evaluated blue accent set — use this in components that are always runner-colored. */
export const blue = Object.freeze({
  bg600:        "bg-blue-600",
  bg600hover:   "hover:bg-blue-500",
  bg700hover:   "hover:bg-blue-700",
  bg500:        "bg-blue-500",
  bgFaint:      "bg-blue-900/10",
  bgSelected:   "bg-blue-900/40",
  bgHoverFaint: "hover:bg-blue-600/20",
  text400:      "text-blue-400",
  text300:      "text-blue-300",
  text200:      "text-blue-200",
  border500:    "border-blue-500",
  border400:    "border-blue-400/50",
  borderFaint:  "border-blue-500/30",
  ring:         "ring-blue-400",
  shadow:       "shadow-blue-900/40",
  labelOffset:  "bg-blue-600/90",
  bg400:        "bg-blue-400",
  hoverText400: "hover:text-blue-400",
} as const);

/**
 * Returns Tailwind color classes keyed by usage, switching from blue (runner)
 * to purple (verifier) so the entire UI reflects the active mode.
 */
export const accent = (mode: AppMode) => {
  const v = mode === "verifier";
  return {
    bg600:        v ? "bg-purple-600"          : "bg-blue-600",
    bg600hover:   v ? "hover:bg-purple-500"    : "hover:bg-blue-500",
    bg700hover:   v ? "hover:bg-purple-700"    : "hover:bg-blue-700",
    bg500:        v ? "bg-purple-500"          : "bg-blue-500",
    bgFaint:      v ? "bg-purple-900/10"       : "bg-blue-900/10",
    bgSelected:   v ? "bg-purple-900/40"       : "bg-blue-900/40",
    bgHoverFaint: v ? "hover:bg-purple-600/20" : "hover:bg-blue-600/20",
    text400:      v ? "text-purple-400"        : "text-blue-400",
    text300:      v ? "text-purple-300"        : "text-blue-300",
    text200:      v ? "text-purple-200"        : "text-blue-200",
    border500:    v ? "border-purple-500"      : "border-blue-500",
    border400:    v ? "border-purple-400/50"   : "border-blue-400/50",
    borderFaint:  v ? "border-purple-500/30"   : "border-blue-500/30",
    ring:         v ? "ring-purple-400"        : "ring-blue-400",
    shadow:       v ? "shadow-purple-900/40"   : "shadow-blue-900/40",
    labelOffset:  v ? "bg-purple-600/90"       : "bg-blue-600/90",
    bg400:        v ? "bg-purple-400"          : "bg-blue-400",
    hoverText400: v ? "hover:text-purple-400"  : "hover:text-blue-400",
  } as const;
};
