import React, { useRef, useState, useEffect } from "react";
import { Card, Button, Alert } from "react-bootstrap";

export default function CameraCapture({
  onCapture,
  onFindPart,
  capturedImage,
  showLiveFeedOnly,
  showCurrentImageOnly,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (showLiveFeedOnly && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    if (!showLiveFeedOnly && stream) {
      // If live feed not displaying, stop camera
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [showLiveFeedOnly, stream]);

  const handleStartCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
    } catch (err) {
      setError("Could not access camera. Check permissions.");
    }
  };

  const handleStopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    setStream(null);
    onCapture && onCapture(null);
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext("2d");
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    const imgData = canvasRef.current.toDataURL("image/png");
    onCapture && onCapture(imgData);
  };

  // LIVE FEED ONLY
  if (showLiveFeedOnly) {
    return (
      <Card className="w-100 h-100" style={{ minHeight: 0, flex: 1, display: "flex", flexDirection: "column" }}>
        {stream && (
          <>
            <Card.Header className="text-center">
              <strong>Live Camera Feed</strong>
            </Card.Header>
            <Card.Body className="d-flex flex-column align-items-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-100 mb-3 rounded"
                style={{ background: "#222", minHeight: 200 }}
              />
              <div>
                <Button variant="success" className="me-2" onClick={handleCapture}>
                  Take Picture
                </Button>
                <Button variant="danger" onClick={handleStopCamera}>
                  Close Camera
                </Button>
              </div>
            </Card.Body>
          </>
        )}
        {!stream && (
          <Button variant="primary" className="mb-3 w-100" onClick={handleStartCamera}>
            Open Camera
          </Button>
        )}
        {error && (
          <Alert variant="danger" className="mt-3 w-100 text-center">{error}</Alert>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </Card>
    );
  }

  // CURRENT IMAGE ONLY
  if (showCurrentImageOnly && capturedImage) {
    return (
      <Card className="w-100 h-100" style={{ minHeight: 0, flex: 1 }}>
        <Card.Header className="text-center">
          <strong>Current Image</strong>
        </Card.Header>
        <Card.Body
          className="text-center d-flex flex-column justify-content-center align-items-center"
          style={{ height: "100%" }}
        >
          <img
            src={capturedImage}
            alt="Captured"
            className="img-fluid rounded mb-2 border"
            style={{
              maxHeight: "400px",
              width: "100%",
              objectFit: "contain",
            }}
          />
          {onFindPart && (
            <Button variant="warning" className="mt-2" onClick={onFindPart}>
              Find Part
            </Button>
          )}
        </Card.Body>
      </Card>
    );
  }

  return null;
}
