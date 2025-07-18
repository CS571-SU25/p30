import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';
import BinsVisualizer from "./BinsVisualizer";



export default function AutomatedSortPage() {
  console.log("AutomatedSortPage mounted/rendered");
    const [recipeNames, setRecipeNames] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [binsData, setBinsData] = useState(Array(12).fill({ color: null, category: null }));

  useEffect(() => {
    console.log("useEffect running");
    fetch('/api/recipes/')
      .then(res => res.json())
      .then(names => {
        setRecipeNames(names);
        console.log("Recipe names from API:", names);
        console.log("Ran");
      })
      .catch(() => setRecipeNames([]));
  }, []);

  // Fetch selected recipe data when selectedRecipe changes
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

  return (
    <Container fluid className="py-3" aria-label="Automated Sorter Page">
      {/* Navbar / Controls Row */}
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
                    <Dropdown.Item key={name} eventKey={name}>
                      {name}
                    </Dropdown.Item>
                  ))
                )}
              </Dropdown.Menu>
            </Dropdown>
            <Button className="mx-2" variant="success" tabIndex={0} aria-label="Start sorting">
              Start
            </Button>
            <Button variant="danger" tabIndex={0} aria-label="Stop sorting">
              Stop
            </Button>
          </Nav>
        </Container>
      </Navbar>

      {/* Main Content Grid */}
      <Row className="g-4">
        {/* Output Bins Visualizer */}
        <Col md={4} sm={12}>
          <BinsVisualizer bins={binsData} />
        </Col>

        {/* Placeholder for Current Image */}
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
              <span>Image preview will appear here</span>
            </div>
          </section>
        </Col>

        {/* Placeholder for Current Part Info */}
        <Col md={4} sm={12}>
          <section aria-labelledby="current-part-heading" className="bg-light border rounded p-3 h-100">
            <h2 id="current-part-heading" className="fs-4">Current Part Info</h2>
            <div
              style={{
                minHeight: 240,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#888"
              }}
              aria-label="Part info placeholder"
            >
              <span>Detected part info will appear here</span>
            </div>
          </section>
        </Col>
      </Row>
    </Container>
  );
}
