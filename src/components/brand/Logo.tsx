import * as React from "react";
import { LogoSymbol } from "./LogoSymbol";

export type LogoVariant = "wordmark" | "lockup" | "stacked" | "symbol";
export type LogoColor = "brand" | "ink" | "onDark" | "mono";

export interface LogoProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: LogoVariant;
  color?: LogoColor;
  size?: number;
  dot?: boolean;
  symbol?: boolean;
}

const PALETTES: Record<LogoColor, { word: string; sub: string; dot: string; mark: string }> = {
  brand: { word: "var(--brand)", sub: "var(--text-muted)", dot: "var(--accent)", mark: "var(--brand)" },
  ink: { word: "var(--text)", sub: "var(--text-muted)", dot: "var(--accent)", mark: "var(--brand)" },
  onDark: { word: "var(--text-on-dark)", sub: "rgba(255,255,255,.6)", dot: "var(--accent)", mark: "var(--text-on-dark)" },
  mono: { word: "currentColor", sub: "currentColor", dot: "currentColor", mark: "currentColor" },
};

export function Logo({
  variant = "wordmark",
  color = "brand",
  size = 32,
  dot = false,
  symbol = true,
  className,
  style,
  ...rest
}: LogoProps) {
  const palette = PALETTES[color] ?? PALETTES.brand;
  const markSize = size * 0.95;
  const mark = (
    <LogoSymbol
      size={markSize}
      weight={markSize < 24 ? 4 : 2.5}
      style={{ color: palette.mark, flexShrink: 0 }}
      aria-hidden="true"
    />
  );

  if (variant === "symbol") {
    return (
      <span className={className} style={{ display: "inline-flex", alignItems: "center", ...style }} {...rest}>
        <LogoSymbol
          size={size}
          weight={size < 24 ? 4 : 2.5}
          style={{ color: palette.mark }}
          role="img"
          aria-label="نظام حسابات SPC"
        />
      </span>
    );
  }

  const word = (
    <span
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 900,
        color: palette.word,
        lineHeight: 1,
        letterSpacing: "-0.01em",
        display: "inline-flex",
        alignItems: "flex-start",
      }}
    >
      نظام حسابات SPC
      {dot && (
        <span
          aria-hidden="true"
          style={{
            width: Math.max(4, size * 0.14),
            height: Math.max(4, size * 0.14),
            borderRadius: "999px",
            background: palette.dot,
            marginInlineStart: size * 0.1,
            marginTop: size * 0.12,
            flexShrink: 0,
          }}
        />
      )}
    </span>
  );

  if (variant === "stacked") {
    return (
      <span
        className={className}
        style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: size * 0.08, fontSize: size, ...style }}
        {...rest}
      >
        {symbol && mark}
        {word}
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: size * 0.32, fontSize: size, ...style }}
      {...rest}
    >
      {symbol && mark}
      {word}
    </span>
  );
}

export default Logo;
