import React from "react";
import { Card, Table, Image } from "react-bootstrap";

export default function StatsPage({ sortedParts }) {
  return (
    <Card className="w-100 h-100">
      <Card.Header className="text-center">
        <strong>Parts Sorted This Session</strong>
      </Card.Header>
      <Card.Body>
        {(!sortedParts || sortedParts.length === 0) ? (
          <div className="text-muted text-center">No parts have been sorted yet.</div>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>Name</th>
                <th>Color Swatch</th>
                <th>LEGO Color</th>
                <th>Category</th>
                <th>Part Number</th>
                <th>Confidence</th>
                <th>Bricklink</th>
              </tr>
            </thead>
            <tbody>
              {sortedParts.map((part, idx) => (
                <tr key={idx}>
                <td>{idx + 1}</td>
                <td>
                    {part.img_url && (
                      <Image src={part.img_url} rounded style={{ maxHeight: 50 }} />
                    )}
                  </td>
                <td>{part.name}</td>
                  <td>
                    <span
                      style={{
                        background: part.hex || "#eee",
                        display: "inline-block",
                        width: 28,
                        height: 28,
                        border: "1px solid #333",
                        borderRadius: "50%",
                        verticalAlign: "middle",
                        horizontalAlign: "middle",
                      }}
                      title={part.lego_color}
                    />
                  </td>
                <td>
                    {part.lego_color} (ID: {part.lego_color_id})<br/>
                    RGB: [{part.lego_color_rgb?.join(", ")}]
                  </td>
                <td>{part.category}</td>
                  <td>{part.id}</td>
                  <td>{Math.round(part.confidence * 100)}%</td>

                  <td>
                    {part.bricklink_url && (
                      <a
                        href={part.bricklink_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary"
                      >
                        Bricklink
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
}
