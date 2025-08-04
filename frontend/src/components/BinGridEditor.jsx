import React from 'react';
import { Row, Col } from 'react-bootstrap';
import BinConfigurator from './BinConfigurator';

export default function BinGridEditor({ binConfigs, setBinConfigs, legoColors, legoCategories }) {
    const handleBinChange = (index, newConfig) => {
        const updated = binConfigs.map((config, i) =>
            i === index
                ? {
                    category: newConfig.category,
                    color: {
                        name: newConfig.color?.name || '',
                        hex: newConfig.color?.hex || ''
                    }
                }
                : { ...config, color: { ...config.color } }
        );
        setBinConfigs(updated);
    };

    return (
        <Row>
            {binConfigs.map((config, index) => (
                <Col key={index} xs={12} md={6} lg={4}>
                    <BinConfigurator
                        binNumber={index}
                        config={config}
                        onChange={handleBinChange}
                        legoColors={legoColors}
                        legoCategories={legoCategories}
                    />
                </Col>
            ))}
        </Row>
    );
}
