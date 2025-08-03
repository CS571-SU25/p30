import React from 'react';
import Card from 'react-bootstrap/Card';

export default function Bin({ binNumber, color, category }) {
  const hasColor = color && color.name && color.hex;
  const showNone = !hasColor && !category;
  const showAny = !hasColor && !!category;

  const swatchBoxStyle = {
    width: "24px",
    height: "24px",
    borderRadius: "6px",
    border: "1px solid #888",
    marginRight: "8px",
    backgroundColor: hasColor ? color.hex : "#EEEEEE",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.4rem",
    verticalAlign: "middle"
  };

  return (
    <Card
      className="mb-2"
      style={{ minWidth: 110, maxWidth: 150, width: "100%", margin: "0 auto" }}
      role="region"
      aria-label={`Bin ${binNumber}: ${showNone ? "None" : showAny ? "Any" : color?.name} ${category || ""}`}
    >
      <Card.Body className="py-2 px-2">
        <Card.Title as="h3" style={{ fontSize: '1rem', marginBottom: 6 }}>
          {`Bin ${binNumber}`}
        </Card.Title>
        <div className="d-flex align-items-center mb-1 justify-content-center">
          <span style={swatchBoxStyle}>
            {showNone || showAny ? "🎨" : ""}
          </span>
          <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
            {showNone ? "None" : showAny ? "Any" : color?.name}
          </span>
        </div>
        {!showNone && (
          <Card.Text style={{ margin: 0, fontSize: "0.95rem", textAlign: "center" }}>
            <span>{category || "Any"}</span>
          </Card.Text>
        )}
      </Card.Body>
    </Card>
  );
}
