import React, { useState, useEffect } from "react";
import CameraCapture from "./CameraCapture";
import PartInfo from "./PartInfo";
import BoundingBoxOverlay from "./BoundingBoxOverlay";
import { Form, Button, Card } from "react-bootstrap";

// Utility to convert dataURL to Blob
function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(",")[1]);
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new Blob([ab], { type: mimeString });
}

export default function SortPage({
  sortedParts,
  setSortedParts,
  capturedImage,
  setCapturedImage,
  lastPartData,
  setLastPartData,
}) {
  const [findPartTrigger, setFindPartTrigger] = useState(0);
  const [autoFindPart, setAutoFindPart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-find on capture
  useEffect(() => {
    if (autoFindPart && capturedImage) {
      setFindPartTrigger((t) => t + 1);
    }
  }, [capturedImage, autoFindPart]);

  const handleCapture = (img) => {
    setCapturedImage(img);
    setLastPartData(null);
    setError(null);
    console.log("[SortPage] Captured new image, len:", img ? img.length : 0);
  };

  const handleFindPart = () => setFindPartTrigger((t) => t + 1);

  // Fetch part info and color from APIs
  useEffect(() => {
    let cancelled = false;
    if (!capturedImage || findPartTrigger === 0) return;

    async function processImage() {
      setLoading(true);
      setError(null);
      let partData = null;
      try {
        // --- BRICKOGNIZE ---
        const form1 = new FormData();
        form1.append("query_image", dataURItoBlob(capturedImage), "capture.png");
        const resp1 = await fetch("https://api.brickognize.com/predict/", {
          method: "POST",
          body: form1,
        });
        if (!resp1.ok) throw new Error(`[Brickognize] Status ${resp1.status}`);
        const data = await resp1.json();

        if (!data.items || !data.items[0]) throw new Error("No part found");
        const item = data.items[0];
        partData = {
          id: item.id,
          name: item.name,
          category: item.category,
          confidence: item.score,
          img_url: item.img_url,
          bricklink_url: item.external_sites?.[0]?.url,
          bounding_box: data.bounding_box || item.bounding_box,
        };

        // --- COLOR DETECT API ---
        const { left, upper, right, lower } = partData.bounding_box;
        const form2 = new FormData();
        form2.append("image", dataURItoBlob(capturedImage), "capture.png");
        form2.append("left", left);
        form2.append("upper", upper);
        form2.append("right", right);
        form2.append("lower", lower);

        const resp2 = await fetch("http://localhost:5001/detect_color", {
          method: "POST",
          body: form2,
        });
        if (!resp2.ok) throw new Error(`[ColorAPI] Status ${resp2.status}`);
        const colorResult = await resp2.json();

        partData = { ...partData, ...colorResult };
      } catch (err) {
        setError("Failed: " + err.message);
        partData = null;
      }
      if (!cancelled) {
        if (partData) setSortedParts((prev) => [...prev, partData]);
        setLastPartData(partData);
        setLoading(false);
      }
    }

    processImage();
    return () => { cancelled = true; };
  }, [findPartTrigger]);

  return (
    <div style={{
      display: "flex", flex: 1, width: "100vw", height: "100%", minHeight: 0, minWidth: 0, overflow: "hidden",
    }}>
      {/* LEFT: Camera (always open) */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", padding: "24px", minWidth: 0,
        background: "#f8f9fa", borderRight: "1px solid #dee2e6", height: "100%"
      }}>
        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
          <Form.Switch
            id="autoFindSwitch"
            label="Auto Find Part"
            checked={autoFindPart}
            onChange={() => setAutoFindPart((val) => !val)}
          />
        </div>
        <CameraCapture
          onCapture={handleCapture}
        />
      </div>
      {/* MIDDLE: Current Image Preview with bounding box and Find Part */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", minWidth: 0, padding: "24px",
        background: "#f8f9fa", borderRight: "1px solid #dee2e6", height: "100%",
        alignItems: "center", justifyContent: "center"
      }}>
        {capturedImage && (
          <Card style={{ width: "100%" }}>
            <Card.Header className="text-center">Current Image</Card.Header>
            <Card.Body className="text-center d-flex flex-column justify-content-center align-items-center">
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "100%",
                  maxWidth: 400,
                }}
              >
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="img-fluid rounded mb-2 border"
                  style={{
                    width: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
                {/* Bounding box overlay */}
                {lastPartData && lastPartData.bounding_box && (
                  <BoundingBoxOverlay
                    boundingBox={lastPartData.bounding_box}
                    imageSrc={capturedImage}
                  />
                )}
              </div>
              <div className="d-flex justify-content-center gap-2 mt-3">
                {!autoFindPart && (
                  <Button
                    variant="warning"
                    onClick={handleFindPart}
                    disabled={loading}
                  >
                    {loading ? "Finding..." : "Find Part"}
                  </Button>
                )}
              </div>
              {error && (
                <div className="alert alert-danger mt-2">{error}</div>
              )}
            </Card.Body>
          </Card>
        )}
      </div>
      {/* RIGHT: Part Info */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "24px",
        minWidth: 0,
        background: "#fff",
        height: "100%",
      }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
          <PartInfo
            image={capturedImage}
            lastPartData={lastPartData}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
