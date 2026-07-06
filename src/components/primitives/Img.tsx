import { useState, type CSSProperties } from "react";
import type { ImgProps } from "../../types/timeline";

export function Img({ src, placeholderColor = "#e0e0e0", style }: ImgProps) {
  const [loaded, setLoaded] = useState(false);

  const containerStyle: CSSProperties = {
    overflow: "hidden",
    backgroundColor: placeholderColor,
    ...style,
  };

  const imgStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: loaded ? "block" : "none",
  };

  return (
    <div style={containerStyle}>
      {!loaded && (
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: placeholderColor,
          }}
        />
      )}
      <img
        src={src}
        style={imgStyle}
        onLoad={() => setLoaded(true)}
        alt=""
        draggable={false}
      />
    </div>
  );
}
