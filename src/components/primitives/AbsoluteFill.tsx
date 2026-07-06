import type { CSSProperties, ReactNode } from "react";

const fillStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
};

export function AbsoluteFill({
  style,
  children,
}: {
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return <div style={{ ...fillStyle, ...style }}>{children}</div>;
}
