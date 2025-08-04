import React, { useState } from "react";
import { Card, Table, Image, Button, Pagination } from "react-bootstrap";
import { saveAs } from "file-saver";

const ITEMS_PER_PAGE = 15;

export default function StatsPage({ sortedParts, setSortedParts }) {
  const [currentPage, setCurrentPage] = useState(1);

  const handleClearStats = () => {
    if (window.confirm("Are you sure you want to clear the stats? This cannot be undone.")) {
      setSortedParts([]);
      setCurrentPage(1);
    }
  };

  const handleDownloadCSV = () => {
    if (!sortedParts.length) return;

    const headers = [
      "Name", "Color HEX", "LEGO Color", "Category", "Part Number",
      "Confidence", "Bricklink URL", "Image URL"
    ];

    const rows = sortedParts.map(part => [
      part.name || "",
      part.hex || "",
      `${part.lego_color || ""} (ID: ${part.lego_color_id || ""})`,
      part.category || "",
      part.id || "",
      `${Math.round(part.confidence * 100)}%`,
      part.bricklink_url || "",
      part.img_url || ""
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${(field ?? "").toString().replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "sorted_parts.csv");
  };

  const totalPages = Math.ceil(sortedParts.length / ITEMS_PER_PAGE);
  const paginatedParts = sortedParts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

    const renderPagination = () => {
    if (totalPages <= 1) return null;

    let items = [];

    items.push(
        <Pagination.Prev
        key="prev"
        onClick={() => setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
        variant="dark"
        />
    );

    for (let number = 1; number <= totalPages; number++) {
        items.push(
        <Pagination.Item
            key={number}
            active={number === currentPage}
            onClick={() => setCurrentPage(number)}
            variant="dark"
            style={{
            backgroundColor: number === currentPage ? "#000" : "#fff",
            color: number === currentPage ? "#fff" : "#000",
            borderColor: "#000"
            }}
        >
            {number}
        </Pagination.Item>
        );
    }

    items.push(
        <Pagination.Next
        key="next"
        onClick={() => setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        variant="dark"
        />
    );

    return <Pagination className="justify-content-center mt-3">{items}</Pagination>;
    };

  return (
    <Card className="w-100 h-100">
      <Card.Header className="text-center d-flex justify-content-between align-items-center">
        <strong>Parts Sorted This Session</strong>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={handleClearStats}>
            Clear Stats
          </Button>
          <Button variant="outline-primary" onClick={handleDownloadCSV} disabled={sortedParts.length === 0}>
            Save to CSV
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {sortedParts.length === 0 ? (
          <div className="text-muted text-center">No parts have been sorted yet.</div>
        ) : (
          <>
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
                {paginatedParts.map((part, idx) => (
                  <tr key={idx}>
                    <td>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                    <td>
                      {part.img_base64 ? (
                        <Image
                          src={`data:image/jpeg;base64,${part.img_base64}`}
                          rounded
                          style={{ maxHeight: 50 }}
                          alt="Detected part"
                        />
                      ) : part.img_url ? (
                        <Image
                          src={part.img_url}
                          rounded
                          style={{ maxHeight: 50 }}
                          alt="Detected part"
                        />
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td>{part.name || <span className="text-muted">N/A</span>}</td>
                    <td>
                      <span
                        style={{
                          background: part.hex || "#eee",
                          display: "inline-block",
                          width: 28,
                          height: 28,
                          border: "1px solid #333",
                          borderRadius: "50%",
                        }}
                        title={part.lego_color}
                      />
                    </td>
                    <td>
                      {part.lego_color} (ID: {part.lego_color_id})<br />
                      RGB: [{part.lego_color_rgb?.join(", ")}]
                    </td>
                    <td>{part.category}</td>
                    <td>{part.id}</td>
                    <td>{Math.round(part.confidence * 100)}%</td>
                    <td>
                      {part.bricklink_url ? (
                        <a
                          href={part.bricklink_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          Bricklink
                        </a>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {renderPagination()}
          </>
        )}
      </Card.Body>
    </Card>
  );
}
