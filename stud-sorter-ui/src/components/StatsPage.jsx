import React from "react";
import { Container, Card, Table } from "react-bootstrap";

export default function StatsPage({ sortedParts }) {
  return (
    <Container fluid className="h-100 d-flex flex-column p-0">
      <div className="flex-grow-1 d-flex align-items-center justify-content-center">
        <Card className="w-100" style={{ maxWidth: 900, minHeight: 400 }}>
          <Card.Header className="text-center">
            <strong>Session Stats</strong>
          </Card.Header>
          <Card.Body>
            {sortedParts.length === 0 ? (
              <div className="text-muted text-center">No parts sorted yet.</div>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Part Number</th>
                    <th>Name</th>
                    <th>Color</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedParts.map((part, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{part.partNumber}</td>
                      <td>{part.name}</td>
                      <td>{part.color}</td>
                      <td>{part.confidence}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
}
