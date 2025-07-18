import React, { useState } from "react";
import SortPage from "./SortPage";
import StatsPage from "./StatsPage";
import { Nav } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import legoBrick from "../assets/lego_brick.png"

export default function App() {
  const [page, setPage] = useState("sort");
  const [sortedParts, setSortedParts] = useState([]);
  const [capturedImage, setCapturedImage] = useState(null);
  const [lastPartData, setLastPartData] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", display: "flex", flexDirection: "column" }}>
      {/* Header */}
        <div className="w-100 bg-dark py-4">
        <div className="container-fluid px-4">
            <div className="d-flex align-items-center">
            <button
                style={{
                border: "none",
                background: "none",
                padding: 0,
                marginRight: "1rem",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                }}
                aria-label="Go to Sort Page"
                onClick={() => setPage("sort")}
            >
                <img
                src={legoBrick} 
                alt="Stud Sorter logo"
                style={{ height: "56px", width: "56px", objectFit: "contain" }}
                />
            </button>
            <h1
                className="text-white display-3 m-0"
                style={{
                textAlign: "left",
                color: "#FFFFFF",
                userSelect: "none",
                lineHeight: "56px",
                }}
            >
                Stud Sorter
            </h1>
            </div>
        </div>
        </div>
      {/* Navigation */}
      <div className="w-100 bg-secondary">
        <div className="container-fluid px-4">
          <Nav className="py-2">
            <Nav.Item>
              <Nav.Link
                as="button"
                className={`text-white fs-5 ${page === "sort" ? "fw-bold text-warning" : ""}`}
                style={{ background: "none", border: "none", textAlign: "left" }}
                onClick={() => setPage("sort")}
              >
                Sort
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                as="button"
                className={`text-white fs-5 ${page === "stats" ? "fw-bold text-warning" : ""}`}
                style={{ background: "none", border: "none", textAlign: "left" }}
                onClick={() => setPage("stats")}
              >
                Stats
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </div>
      </div>
      {/* Main Content */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", width: "100vw" }}>
        {page === "sort" ? (
          <SortPage
            sortedParts={sortedParts}
            setSortedParts={setSortedParts}
            capturedImage={capturedImage}
            setCapturedImage={setCapturedImage}
            lastPartData={lastPartData}
            setLastPartData={setLastPartData}
          />
        ) : (
          <StatsPage sortedParts={sortedParts} />
        )}
      </div>
    </div>
  );
}
