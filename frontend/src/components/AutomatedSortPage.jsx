import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';
import BinsVisualizer from "./BinsVisualizer";
import PartInfo from "./PartInfo";
import usePersistentState from './hooks/usePersistentState';

export default function AutomatedSortPage({ sortedParts, setSortedParts }) {
  const [recipeNames, setRecipeNames] = usePersistentState('auto_recipeNames', []);
  const [selectedRecipe, setSelectedRecipe] = usePersistentState('auto_selectedRecipe', null);
  const [binsData, setBinsData] = usePersistentState('auto_binsData', Array(12).fill({ color: null, category: null }));
  const [isSorting, setIsSorting] = usePersistentState('auto_isSorting', false);

  const [latestImageUrl, setLatestImageUrl] = useState(null); 
  const [latestPartInfo, setLatestPartInfo] = useState(null); 
  const [error, setError] = useState(null);

  // Debug render
  console.log("Rendering - isSorting:", isSorting, "latestPartInfo:", latestPartInfo);

  useEffect(() => {
    fetch('/api/recipes/')
      .then(res => res.json())
      .then(names => {
        console.log("Recipe names fetched:", names);
        setRecipeNames(names);
      })
      .catch(err => {
        console.error("Failed to fetch recipes", err);
        setRecipeNames([]);
      });
  }, []);

  useEffect(() => {
    if (selectedRecipe) {
      console.log("Fetching recipe:", selectedRecipe);
      fetch(`/api/recipes/${selectedRecipe}`)
        .then(res => res.json())
        .then(data => {
          console.log("Recipe loaded:", data);
          setBinsData(data.bins || Array(12).fill({ color: null, category: null }));
        })
        .catch(err => {
          console.error("Failed to load recipe bins:", err);
          setBinsData(Array(12).fill({ color: null, category: null }));
        });
    } else {
      console.log("No recipe selected. Resetting bins.");
      setBinsData(Array(12).fill({ color: null, category: null }));
    }
  }, [selectedRecipe]);

  useEffect(() => {
    if (!isSorting) {
      console.log("Sorting stopped. SSE not connected.");
      return;
    }

    console.log("Connecting to SSE stream...");
    const eventSource = new EventSource('/api/detection/stream');

eventSource.onmessage = (e) => {
  try {
    const data = JSON.parse(e.data);
    console.log("SSE received:", data);

    setError(null);
    setLatestImageUrl(data.image_url || null);
    console.log("Raw items from data.items:", data.items);

    if (!Array.isArray(data.items) || data.items.length === 0) {
      console.warn("SSE message received, but no items present");
      return;
    }

    const part = data.items[0];

    const parsedPart = {
      id: part.id,
      name: part.name,
      category: part.category,
      confidence: part.score !== undefined ? Math.round(part.score * 100) : null,
      img_url: part.img_url ?? null,
      img_base64: data.img_base64 ?? null,
      bricklink_url: part.external_sites?.[0]?.url ?? null,
      lego_color: data.lego_color ?? "Unknown",
      lego_color_id: data.lego_color_id ?? -1,
      lego_color_rgb: data.lego_color_rgb ?? [0, 0, 0],
      hex: data.hex ?? "#ccc",
    };

    console.log("Parsed part:", parsedPart);

    setLatestPartInfo(parsedPart);
    setSortedParts(prev => [...prev, parsedPart]);

  } catch (err) {
    console.error("Error parsing SSE data:", err);
  }
};

    eventSource.onerror = (err) => {
      console.warn("SSE warning (non-fatal):", err);
      setError("Warning: temporary connection issue with detection stream.");
    };

    return () => {
      console.log("SSE disconnected.");
      eventSource.close();
      setLatestImageUrl(null);
      setLatestPartInfo(null);
    };
  }, [isSorting]);

  const handleStart = () => {
    if (!selectedRecipe) {
      console.warn("Cannot start sorting: no recipe selected.");
      return;
    }
    console.log("Starting sorting...");
    fetch('/api/detection/start', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipe: selectedRecipe,
        video_source: "/app/tests/test_videos/test_video_1.mp4"
      }),
    }).then(() => {
      setIsSorting(true);
    });
  };

  const handleStop = () => {
    console.log("Stopping sorting...");
    fetch('/api/detection/stop', { method: 'POST' }).then(() => setIsSorting(false));
  };

  return (
    <Container fluid className="py-3" aria-label="Automated Sorter Page">
      <Navbar bg="light" expand="md" className="mb-4 rounded shadow" style={{ minHeight: '64px' }}>
        <Container fluid>
          <Navbar.Brand as="h1" className="fs-3 mb-0">Automated Sorter</Navbar.Brand>
          <Nav className="ms-auto align-items-center">
            <Dropdown onSelect={(val) => { console.log("Recipe selected:", val); setSelectedRecipe(val); }}>
              <Dropdown.Toggle variant="outline-dark" id="dropdown-sort-method">
                {selectedRecipe || "Select Sort Recipe"}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {recipeNames.length === 0 ? (
                  <Dropdown.Item disabled>No recipes yet</Dropdown.Item>
                ) : (
                  recipeNames.map(name => (
                    <Dropdown.Item key={name} eventKey={name}>{name}</Dropdown.Item>
                  ))
                )}
              </Dropdown.Menu>
            </Dropdown>
            <Button className="mx-2" variant="success" tabIndex={0} aria-label="Start sorting" onClick={handleStart} disabled={isSorting || !selectedRecipe}>
              Start
            </Button>
            <Button variant="danger" tabIndex={0} aria-label="Stop sorting" onClick={handleStop} disabled={!isSorting}>
              Stop
            </Button>
          </Nav>
        </Container>
      </Navbar>

      <Row className="g-4">
        <Col md={4} sm={12}>
          <BinsVisualizer bins={binsData} />
        </Col>

        <Col md={4} sm={12}>
          <section aria-labelledby="current-image-heading" className="bg-light border rounded p-3 h-100">
            <h2 id="current-image-heading" className="fs-4">Current Image</h2>
            <div
              style={{
                minHeight: 240,
                background: "#e9ecef",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#888"
              }}
              aria-label="Image placeholder"
            >
              {latestPartInfo?.img_base64 || latestImageUrl ? (
                <img
                  src={
                    latestPartInfo?.img_base64
                      ? `data:image/jpeg;base64,${latestPartInfo.img_base64}`
                      : latestImageUrl
                  }
                  alt="Detected Lego Piece"
                  style={{ maxWidth: "100%", maxHeight: "220px", borderRadius: "8px" }}
                />
              ) : (
                <span>Image preview will appear here</span>
              )}
            </div>
          </section>
        </Col>

        <Col md={4} sm={12}>
          <section aria-labelledby="current-part-heading" className="bg-light border rounded p-3 h-100">
            <h2 id="current-part-heading" className="fs-4">Current Part Info</h2>
            <PartInfo
              image={latestImageUrl}
              lastPartData={latestPartInfo}
              loading={isSorting && !latestPartInfo && !error}
              error={error}
            />
          </section>
        </Col>
      </Row>
    </Container>
  );
}
