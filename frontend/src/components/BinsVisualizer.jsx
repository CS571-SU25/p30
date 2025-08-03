import React from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Bin from './general/Bin';

export default function BinsVisualizer({ bins }) {
  return (
    <section aria-labelledby="bins-heading">
      <h2 id="bins-heading" className="mb-3">Output Bins</h2>
      <Row xs={2} sm={3} md={3} lg={4} className="g-2">
        {bins.map((bin, idx) => (
          <Col key={idx}>
            <Bin
              binNumber={idx + 1}
              color={bin.color}
              category={bin.category}
            />
          </Col>
        ))}
      </Row>
    </section>
  );
}
