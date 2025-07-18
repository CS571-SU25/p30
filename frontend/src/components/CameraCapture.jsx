import React, { useRef, useState, useEffect } from "react";
import { Card, Button } from "react-bootstrap";

export default function CameraCapture({
  onCapture,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        console.log("[CameraCapture] Camera stopped (component unmount)");
      }
    };
  }, [stream]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleStartCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      console.log("[CameraCapture] Camera started");
    } catch (err) {
      setError("Could not access camera. Check permissions.");
      console.error("[CameraCapture] Error starting camera:", err);
    }
  };

  const handleStopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      console.log("[CameraCapture] Camera stopped by user");
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.warn("[CameraCapture] Missing refs for capture");
      return;
    }
    const context = canvasRef.current.getContext("2d");
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    const imgData = canvasRef.current.toDataURL("image/png");
    console.log("[CameraCapture] Captured Image DataURL:", imgData.substring(0, 80), "...len:", imgData.length);
    onCapture && onCapture(imgData);
  };

  return (
    <Card className="w-100 h-100" style={{ minHeight: 0, flex: 1, display: "flex", flexDirection: "column" }}>
      {stream ? (
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
      ) : (
        <Button variant="dark" className="mb-3 w-100" onClick={handleStartCamera}>
          Open Camera
        </Button>
      )}
      {error && (
        <div className="alert alert-danger mt-3 w-100 text-center">{error}</div>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </Card>
  );
}
