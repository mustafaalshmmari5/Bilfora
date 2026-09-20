export function shadeColor(hex: string, amount: number) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function applyAccentColor(color: string) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const soft = color + "18";
  const softStrong = color + "2b";
  const verySoft = color + "10";

  root.style.setProperty("--brand", color);
  root.style.setProperty("--primary", color);
  root.style.setProperty("--ring", color);
  root.style.setProperty("--brand-accent", color);
  root.style.setProperty("--info", color);

  root.style.setProperty("--brand-hover", shadeColor(color, -18));
  root.style.setProperty("--brand-active", shadeColor(color, -32));
  root.style.setProperty("--brand-soft", soft);
  root.style.setProperty("--brand-soft-2", softStrong);
  root.style.setProperty("--info-soft", soft);
  root.style.setProperty("--info-border", softStrong);

  root.style.setProperty("--accent", verySoft);
  root.style.setProperty("--accent-foreground", color);

  root.style.setProperty("--sidebar-primary", color);
  root.style.setProperty("--sidebar-accent", soft);
  root.style.setProperty("--sidebar-accent-foreground", color);
  root.style.setProperty("--sidebar-ring", color);

  root.style.setProperty("--chart-1", color);
  root.style.setProperty("--chart-2", shadeColor(color, -24));
  root.style.setProperty("--chart-3", shadeColor(color, 26));
  root.style.setProperty("--chart-4", shadeColor(color, 52));
  root.style.setProperty("--chart-5", shadeColor(color, -46));

  root.style.setProperty("--shadow-focus", `0 0 0 3px ${color}38`);
  root.style.setProperty("--shadow-brand", `0 10px 26px ${color}42`);

  localStorage.setItem("spc-accent", color);
}
