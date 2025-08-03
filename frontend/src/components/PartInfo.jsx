import React from "react";
import { Card, Spinner, Alert, Image } from "react-bootstrap";

export default function PartInfo({ image, lastPartData, loading, error }) {
  const isParsedFormat = lastPartData?.partNumber !== undefined;

  // Normalize data for display regardless of format
  const partNumber = isParsedFormat ? lastPartData.partNumber : lastPartData?.id;
  const name = isParsedFormat ? lastPartData.name : lastPartData?.name;
  const category = isParsedFormat ? lastPartData.category : lastPartData?.category;
  const confidence = isParsedFormat
    ? lastPartData.confidence
    : lastPartData?.score
      ? Math.round(lastPartData.score * 100)
      : null;

  const colorName = isParsedFormat
    ? lastPartData.color?.name
    : lastPartData?.lego_color;
  const colorId = isParsedFormat
    ? lastPartData.color?.id
    : lastPartData?.lego_color_id;
  const colorRgb = isParsedFormat
    ? lastPartData.color?.rgb
    : lastPartData?.lego_color_rgb;
  const hex = isParsedFormat
    ? `rgb(${colorRgb?.join(",")})`
    : lastPartData?.hex;

  const imgUrl = isParsedFormat
    ? image
    : lastPartData?.img_url;

  const bricklinkUrl = isParsedFormat
    ? null
    : lastPartData?.external_sites?.find(site => site.name === "bricklink")?.url;

  return (
    <Card className="w-100 h-100">
      <Card.Header className="text-center">
        <strong>Part Information</strong>
      </Card.Header>
      <Card.Body
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: 180 }}
      >
        {!image && !lastPartData && (
          <div className="text-muted text-center">
            Take a picture and press "Find Part"!
          </div>
        )}

        {loading && (
          <>
            <Spinner animation="border" variant="primary" className="mb-2" />
            <div className="mt-2">Identifying part...</div>
          </>
        )}

        {error && (
          <Alert variant="warning" className="w-100 text-center mt-2">
            {error}
          </Alert>
        )}

        {lastPartData && !loading && !error && (
          <div className="text-center">
            {imgUrl && (
              <div>
                <Image
                  src={imgUrl}
                  alt="Detected Lego"
                  rounded
                  style={{ maxHeight: 120 }}
                  className="mb-2"
                />
              </div>
            )}

            <p><strong>Part Number:</strong> {partNumber}</p>
            <p><strong>Name:</strong> {name}</p>
            <p><strong>Category:</strong> {category}</p>
            {confidence !== null && <p><strong>Confidence:</strong> {confidence}%</p>}

            {colorName && (
              <div className="mt-3">
                <strong>LEGO Color:</strong> {colorName}
                <span
                  style={{
                    background: hex || "#eee",
                    display: "inline-block",
                    width: 32,
                    height: 32,
                    border: "1px solid #333",
                    borderRadius: "50%",
                    verticalAlign: "middle",
                    marginLeft: 12,
                    marginRight: 8,
                  }}
                  title={colorName}
                />
                <span style={{ color: "#888" }}>
                  (ID: {colorId})<br />
                  RGB: [{colorRgb?.join(", ")}]
                </span>
              </div>
            )}

            {bricklinkUrl && (
              <a
                href={bricklinkUrl}
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
