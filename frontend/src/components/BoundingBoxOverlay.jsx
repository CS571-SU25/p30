import React, { useRef, useState, useEffect } from "react";

/**
 * boundingBox = { left, upper, right, lower, image_width, image_height }
 * imageSrc = captured image (data url)
 */
export default function BoundingBoxOverlay({ boundingBox, imageSrc }) {
  const imgRef = useRef(null);
  const [dims, setDims] = useState({ w: 1, h: 1 });

  useEffect(() => {
    if (!imgRef.current) return;
    function updateDims() {
      setDims({
        w: imgRef.current.offsetWidth,
        h: imgRef.current.offsetHeight,
      });
    }
    updateDims();
    window.addEventListener("resize", updateDims);
    return () => window.removeEventListener("resize", updateDims);
  }, [imageSrc]);

  if (!boundingBox) return null;

  const { left, upper, right, lower, image_width, image_height } = boundingBox;
  const scaleX = dims.w / (image_width || 1);
  const scaleY = dims.h / (image_height || 1);

  const boxLeft = left * scaleX;
  const boxTop = upper * scaleY;
  const boxWidth = (right - left) * scaleX;
  const boxHeight = (lower - upper) * scaleY;

  return (
    <>
      <img
        ref={imgRef}
        src={imageSrc}
        alt=""
        style={{
          visibility: "hidden",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "auto",
          pointerEvents: "none"
        }}
        aria-hidden="true"
      />
      <div
        style={{
          position: "absolute",
          left: boxLeft,
          top: boxTop,
          width: boxWidth,
          height: boxHeight,
          border: "3px solid #39FF14",
          borderRadius: 8,
          pointerEvents: "none",
          boxSizing: "border-box",
        }}
      />
    </>
  );
}
