import React, { useState, useEffect } from "react";
import CameraCapture from "./CameraCapture";
import PartInfo from "./PartInfo";
import { Form } from "react-bootstrap";

export default function SortPage({
  sortedParts,
  setSortedParts,
  capturedImage,
  setCapturedImage,
  lastPartData,
  setLastPartData
}) {
  const [findPartTrigger, setFindPartTrigger] = useState(0);
  const [autoFindPart, setAutoFindPart] = useState(false);

  useEffect(() => {
    if (autoFindPart && capturedImage) {
      setFindPartTrigger(t => t + 1);
    }
  }, [capturedImage, autoFindPart]);

  const handleFindPart = () => setFindPartTrigger(t => t + 1);

  // --- FIX: clear part data when new image captured ---
  const handleCapture = (img) => {
    setCapturedImage(img);
    setLastPartData(null); // <-- Clear part data and bounding box
  };

  const handleNewPart = (partData) => {
    if (partData) setSortedParts(prev => [...prev, partData]);
    setLastPartData(partData);
  };

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        width: "100vw",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      {/* LEFT: Camera + Current Image (66%) */}
      <div
        style={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          minWidth: 0,
          background: "#f8f9fa",
          borderRight: "1px solid #dee2e6",
          height: "100%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
          <Form.Switch
            id="autoFindSwitch"
            label="Auto Find Part"
            checked={autoFindPart}
            onChange={() => setAutoFindPart(val => !val)}
          />
        </div>
        {/* Side by side camera + current image */}
        <div style={{ flex: 1, display: "flex", gap: 24 }}>
          {/* Live camera feed */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <CameraCapture
              onCapture={handleCapture}
              capturedImage={capturedImage}
              showLiveFeedOnly={true}
            />
          </div>
          {/* Current image with bounding box */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <CameraCapture
              capturedImage={capturedImage}
              boundingBox={lastPartData?.bounding_box}
              onFindPart={handleFindPart}
              showCurrentImageOnly={true}
            />
          </div>
        </div>
      </div>

      {/* RIGHT: Part Info (33%) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          minWidth: 0,
          background: "#fff",
          height: "100%",
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
          <PartInfo
            image={capturedImage}
            trigger={findPartTrigger}
            onNewPart={handleNewPart}
            lastPartData={lastPartData}
          />
        </div>
      </div>
    </div>
  );
}
