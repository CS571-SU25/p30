import React from "react";
import { Card, Spinner, Alert, Image } from "react-bootstrap";

export default function PartInfo({ image, lastPartData, loading, error }) {
  const partData = lastPartData;

  return (
    <Card className="w-100 h-100">
      <Card.Header className="text-center">
        <strong>Part Information</strong>
      </Card.Header>
      <Card.Body className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: 180 }}>
        {!image && !partData && (
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
        {partData && !loading && !error && (
          <div className="text-center">
            {partData.img_url && (
              <div>
                <Image src={partData.img_url} rounded style={{ maxHeight: 120 }} className="mb-2" />
              </div>
            )}
            <p><strong>Part Number:</strong> {partData.id}</p>
            <p><strong>Name:</strong> {partData.name}</p>
            <p><strong>Category:</strong> {partData.category}</p>
            <p><strong>Confidence:</strong> {Math.round(partData.confidence * 100)}%</p>
            {partData.bricklink_url && (
              <a
                href={partData.bricklink_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-primary mt-2"
              >
                View on Bricklink
              </a>
            )}
            {/* Color info */}
            {partData.lego_color && (
              <div className="mt-3">
                <strong>LEGO Color:</strong> {partData.lego_color}{" "}
                <span
                  style={{
                    background: partData.hex || "#eee",
                    display: "inline-block",
                    width: 32,
                    height: 32,
                    border: "1px solid #333",
                    borderRadius: "50%",
                    verticalAlign: "middle",
                    marginLeft: 12,
                    marginRight: 8,
                  }}
                  title={partData.lego_color}
                />
                <span style={{ color: "#888" }}>
                  (ID: {partData.lego_color_id})<br />
                  RGB: [{partData.lego_color_rgb?.join(", ")}]
                </span>
              </div>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
