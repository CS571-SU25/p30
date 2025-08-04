import React, { useEffect, useRef } from 'react';
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

export default function AutomatedSortPage() {
  const [recipeNames, setRecipeNames] = usePersistentState('auto_recipeNames', []);
  const [selectedRecipe, setSelectedRecipe] = usePersistentState('auto_selectedRecipe', null);
  const [binsData, setBinsData] = usePersistentState('auto_binsData', Array(12).fill({ color: null, category: null }));

  const [isSorting, setIsSorting] = usePersistentState('auto_isSorting', false);
  const [latestImageUrl, setLatestImageUrl] = usePersistentState('auto_latestImageUrl', null);
  const [latestPartInfo, setLatestPartInfo] = usePersistentState('auto_latestPartInfo', null);
  const [error, setError] = usePersistentState('auto_error', null);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    fetch('/api/recipes/')
      .then(res => res.json())
      .then(names => setRecipeNames(names))
      .catch(() => setRecipeNames([]));
  }, []);

  useEffect(() => {
    if (selectedRecipe) {
      fetch(`/api/recipes/${selectedRecipe}`)
        .then(res => res.json())
        .then(data => setBinsData(data.bins || Array(12).fill({ color: null, category: null })))
        .catch(() => setBinsData(Array(12).fill({ color: null, category: null })));
    } else {
      setBinsData(Array(12).fill({ color: null, category: null }));
    }
  }, [selectedRecipe]);

  useEffect(() => {
    if (isSorting) {
      pollingIntervalRef.current = setInterval(() => {
        fetch('/api/detection/latest')
          .then(res => {
            if (res.status === 204) return null;
            return res.json();
          })
          .then(data => {
            if (data) {
              console.log("📸 Raw detection result:", data);

              setLatestImageUrl(data.image_url || null);

              const part = data.part_info?.items?.[0];
              if (!part) {
                console.warn("⚠️ No part found in items array");
                setLatestPartInfo(null);
                return;
              }

              const parsedPart = {
                ...part,
                confidence: part.score ? Math.round(part.score * 100) : null,
                img_url: part.img_url,
                img_base64: data.part_info?.img_base64 ?? null,
                lego_color: data.part_info?.lego_color ?? "Unknown",
                lego_color_id: data.part_info?.lego_color_id ?? -1,
                lego_color_rgb: data.part_info?.lego_color_rgb ?? [0, 0, 0]
              };

              setLatestPartInfo(parsedPart);
              setError(null);
            }
          })
          .catch(() => setError("Failed to fetch detection data."));
      }, 2000);
    } else {
      clearInterval(pollingIntervalRef.current);
      setLatestImageUrl(null);
      setLatestPartInfo(null);
    }

    return () => clearInterval(pollingIntervalRef.current);
  }, [isSorting]);

  const handleStart = () => {
    if (!selectedRecipe) return;
    fetch('/api/detection/start', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipe: selectedRecipe,
        video_source: "/app/tests/test_videos/test_video_1.mp4"
      }),
    }).then(() => setIsSorting(true));
  };

  const handleStop = () => {
    fetch('/api/detection/stop', { method: 'POST' }).then(() => setIsSorting(false));
  };

  return (
    <Container fluid className="py-3" aria-label="Automated Sorter Page">
      <Navbar bg="light" expand="md" className="mb-4 rounded shadow" style={{ minHeight: '64px' }}>
        <Container fluid>
          <Navbar.Brand as="h1" className="fs-3 mb-0">Automated Sorter</Navbar.Brand>
          <Nav className="ms-auto align-items-center">
            <Dropdown onSelect={setSelectedRecipe}>
              <Dropdown.Toggle variant="outline-dark" id="dropdown-sort-method">
                {selectedRecipe ? selectedRecipe : "Select Sort Recipe"}
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
              {latestImageUrl || latestPartInfo?.img_base64 ? (
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
