import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';
import BinsVisualizer from "./BinsVisualizer";

// Dummy bin data
const binsData = [
  { color: { name: null, hex: null }, category: 'Brick' },
  { color: { name: 'Blue', hex: '#0055BF' }, category: 'Plate' },
  { color: { name: 'Yellow', hex: '#F2CD37' }, category: 'Tile' },
  { color: { name: 'Green', hex: '#237841' }, category: 'Slope' },
  { color: { name: 'White', hex: '#FFFFFF' }, category: 'Brick' },
  { color: { name: 'Black', hex: '#231F20' }, category: 'Technic' },
  { color: { name: 'Orange', hex: '#F57F20' }, category: 'Brick' },
  { color: { name: 'Dark Blue', hex: '#2032A0' }, category: 'Plate' },
  { color: { name: 'Tan', hex: '#E4CD9E' }, category: 'Tile' },
  { color: { name: 'Purple', hex: '#923978' }, category: 'Slope' },
  { color: { name: 'Lime', hex: '#BBE90D' }, category: 'Technic' },
  { color: { name: null, hex: null }, category: null }
];

export default function AutomatedSortPage() {
  return (
    <Container fluid className="py-3" aria-label="Automated Sorter Page">
      {/* Navbar / Controls Row */}
      <Navbar bg="light" expand="md" className="mb-4 rounded shadow" style={{minHeight: '64px'}}>
        <Container fluid>
          <Navbar.Brand as="h1" className="fs-3 mb-0">Automated Sorter</Navbar.Brand>
          <Nav className="ms-auto align-items-center">
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" id="dropdown-sort-method">
                Select Sort Recipe
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {/* Add dropdown items here in the future */}
                <Dropdown.Item disabled>No recipes yet</Dropdown.Item>
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
              {/* Will be replaced by actual camera image */}
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
