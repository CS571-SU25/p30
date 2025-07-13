import React, { useEffect, useState } from "react";
import { Card, Spinner, Alert, Image } from "react-bootstrap";

// Toggle for mock/dev
const USE_MOCK_API = false;
const API_URL = "https://api.brickognize.com/predict/";

export default function PartInfo({ image, trigger, onNewPart, lastPartData }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!image || trigger <= 0) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    if (USE_MOCK_API) {
      setTimeout(() => {
        if (cancelled) return;
        if (Math.random() > 0.2) {
          const mock = {
            id: "98283",
            name: "Brick, Modified 1 x 2 with Masonry Profile",
            category: "Brick, Modified",
            confidence: 0.790967,
            img_url: "https://storage.googleapis.com/brickognize-static/thumbnails-v2.16/part/98283/0.webp",
            bricklink_url: "https://www.bricklink.com/v2/catalog/catalogitem.page?P=98283",
            bounding_box: {
              left: 80, upper: 45, right: 240, lower: 170,
              image_width: 320, image_height: 240,
            }
          };
          onNewPart?.(mock);
          setError(null);
        } else {
          setError("Part not found.");
          onNewPart?.(null);
        }
        setLoading(false);
      }, 1200);
    } else {
      const form = new FormData();
      form.append("query_image", dataURItoBlob(image), "capture.png");

      fetch(API_URL, { method: "POST", body: form })
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (!data.items || data.items.length === 0) {
            setError("Part not found.");
            onNewPart?.(null);
            return;
          }
          const item = data.items[0];
          const result = {
            id: item.id,
            name: item.name,
            category: item.category,
            confidence: item.score,
            img_url: item.img_url,
            bricklink_url: item.external_sites?.[0]?.url,
            bounding_box: data.bounding_box || item.bounding_box,
          };
          onNewPart?.(result);
          setError(null);
        })
        .catch((err) => {
          setError("Brickognize error: " + err.message);
          onNewPart?.(null);
        })
        .finally(() => setLoading(false));
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line
  }, [trigger]);

  function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: mimeString });
  }

  return (
    <Card className="w-100 h-100">
      <Card.Header className="text-center">
        <strong>Part Information</strong>
      </Card.Header>
      <Card.Body className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: 180 }}>
        {!image && !lastPartData && (
          <div className="text-muted text-center">Take a picture and press "Find Part"!</div>
        )}
        {loading && (
          <>
            <Spinner animation="border" variant="primary" className="mb-2" />
            <div className="mt-2">Identifying part...</div>
          </>
        )}
        {error && (
          <Alert variant="warning" className="w-100 text-center mt-2">{error}</Alert>
        )}
        {lastPartData && !loading && !error && (
          <div className="text-center">
            {lastPartData.img_url && (
              <div>
                <Image src={lastPartData.img_url} rounded style={{ maxHeight: 120 }} className="mb-2" />
              </div>
            )}
            <p><strong>Part Number:</strong> {lastPartData.id}</p>
            <p><strong>Name:</strong> {lastPartData.name}</p>
            <p><strong>Category:</strong> {lastPartData.category}</p>
            <p><strong>Confidence:</strong> {Math.round(lastPartData.confidence * 100)}%</p>
            {lastPartData.bricklink_url && (
              <a
                href={lastPartData.bricklink_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-primary mt-2"
              >
                View on Bricklink
              </a>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
