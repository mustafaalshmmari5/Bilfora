import * as React from "react";

export type LogoVariant = "wordmark" | "lockup" | "stacked" | "symbol";
export type LogoColor = "brand" | "ink" | "onDark" | "mono";

export interface LogoProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: LogoVariant;
  color?: LogoColor;
  size?: number;
  dot?: boolean;
  symbol?: boolean;
}

export function Logo({
  variant = "wordmark",
  size = 32,
  className,
  style,
  ...rest
}: LogoProps) {
  const symbolOnly = variant === "symbol";
  const width = symbolOnly ? size : Math.max(size * 5.1, 150);
  const height = symbolOnly ? size : width * (290 / 720);

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
      {...rest}
    >
      <img
        src="/spc-logo.svg"
        alt="SPC - Solution Portal Company"
        width={Math.round(width)}
        height={Math.round(height)}
        style={{
          display: "block",
          objectFit: "contain",
          width: symbolOnly ? size : width,
          height: symbolOnly ? size : height,
          maxWidth: "100%",
        }}
      />
    </span>
  );
}

export default Logo;
