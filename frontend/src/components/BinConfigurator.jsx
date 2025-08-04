import React from 'react';
import { Card, Form } from 'react-bootstrap';
import Select from 'react-select';

export default function BinConfigurator({ binNumber, config, onChange, legoColors = [], legoCategories = [] }) {
    const handleCategorySelect = (selected) => {
        onChange(binNumber, {
            ...config,
            category: selected?.value || ""
        });
    };

    const handleColorSelect = (selected) => {
        onChange(binNumber, {
            ...config,
            color: {
                name: selected?.label || '',
                hex: selected?.value || ''
            }
        });
    };

    const colorOptions = legoColors.map(color => ({
        label: color.name,
        value: color.hex
    }));

    const categoryOptions = legoCategories.map(cat => ({
        label: cat,
        value: cat
    }));

    const selectedColorOption = colorOptions.find(opt => opt.label === config.color?.name) || null;
    const selectedCategoryOption = categoryOptions.find(opt => opt.value === config.category) || null;

    const backgroundColor = config.color?.hex || '#ffffff';

    // Simple contrast check
    const getTextColor = (hex) => {
        if (!hex) return '#000';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const yiq = (r * 299 + g * 587 + b * 114) / 1000;
        return yiq >= 128 ? '#000' : '#fff';
    };

    return (
        <Card className="mb-3">
            <Card.Body>
                <Card.Title>Bin {binNumber + 1}</Card.Title>

                <Form.Group className="mb-3">
                    <Form.Label htmlFor={`category-${binNumber}`}>Category</Form.Label>
                    <Select
                        id={`category-${binNumber}`}
                        options={categoryOptions}
                        value={selectedCategoryOption}
                        onChange={handleCategorySelect}
                        placeholder="Search for a category..."
                        isClearable
                        maxMenuHeight={300}
                        filterOption={(option, input) =>
                            new RegExp(input, 'i').test(option.label)
                        }
                    />
                    <Form.Text muted>Type of LEGO part (e.g., Brick, Plate, Tile).</Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Color</Form.Label>
                    <Select
                        options={colorOptions}
                        value={selectedColorOption}
                        onChange={handleColorSelect}
                        placeholder="Search for a color..."
                        isClearable
                        maxMenuHeight={300}
                        filterOption={(option, input) =>
                            new RegExp(input, 'i').test(option.label)
                        }
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Color HEX</Form.Label>
                    <Form.Control
                        readOnly
                        disabled
                        value={config.color?.hex || ""}
                        style={{
                            backgroundColor,
                            color: getTextColor(backgroundColor),
                            fontWeight: 'bold',
                        }}
                        aria-label="Selected LEGO color hex code"
                    />
                </Form.Group>
            </Card.Body>
        </Card>
    );
}
