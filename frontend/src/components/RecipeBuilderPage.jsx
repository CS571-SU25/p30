import React from 'react';
import { Container, Form, Button } from 'react-bootstrap';
import BinGridEditor from '../components/BinGridEditor';
import RecipeControls from '../components/RecipeControls';
import usePersistentState from './hooks/usePersistentState';

export default function RecipeBuilderPage() {
    const [binConfigs, setBinConfigs] = usePersistentState(
        'recipe-builder-bin-configs',
        Array.from({ length: 12 }, () => ({ color: { name: '', hex: '' }, category: '' }))
    );
    const [recipeName, setRecipeName] = usePersistentState('recipe-builder-name', '');
    const [isEditing, setIsEditing] = usePersistentState('recipe-builder-editing', false);
    const [existingNames, setExistingNames] = React.useState([]);
    const [legoColors, setLegoColors] = React.useState([]);
    const [legoCategories, setLegoCategories] = React.useState([]);

    React.useEffect(() => {
        fetch('/api/recipes/')
            .then(res => res.json())
            .then(setExistingNames)
            .catch(() => setExistingNames([]));

        fetch('/api/recipes/colors')
            .then(res => res.json())
            .then(setLegoColors)
            .catch(() => setLegoColors([]));

        fetch('/api/recipes/categories')
            .then(res => res.json())
            .then(setLegoCategories)
            .catch(() => setLegoCategories([]));
    }, []);

    const handleLoadRecipe = () => {
        fetch(`/api/recipes/${recipeName}`)
            .then(res => res.json())
            .then(data => {
                setBinConfigs(
                    (data.bins || []).map((b = {}) => ({
                        category: b.category || '',
                        color: {
                            name: b.color?.name || '',
                            hex: b.color?.hex || ''
                        }
                    }))
                );
                setIsEditing(true);
            })
            .catch(() => alert('Failed to load the selected recipe.'));
    };

    return (
        <Container className="my-4">
            <h1>Recipe Builder</h1>
            <Form.Group className="mb-3">
                <Form.Label htmlFor="recipe-name">Recipe Name</Form.Label>
                <Form.Control
                    id="recipe-name"
                    type="text"
                    value={recipeName}
                    onChange={(e) => {
                        setRecipeName(e.target.value);
                        setIsEditing(false);
                    }}
                    placeholder="e.g. Classic"
                />
                {existingNames.includes(recipeName) && !isEditing && (
                    <div className="mt-2">
                        <Button variant="outline-primary" onClick={handleLoadRecipe}>
                            Load & Edit Existing Recipe
                        </Button>
                    </div>
                )}
            </Form.Group>

            <RecipeControls
                binConfigs={binConfigs}
                setBinConfigs={setBinConfigs}
                recipeName={recipeName}
                existingNames={existingNames}
                isEditing={isEditing}
            />

            <BinGridEditor
                binConfigs={binConfigs}
                setBinConfigs={setBinConfigs}
                legoColors={legoColors}
                legoCategories={legoCategories}
            />
        </Container>
    );
}
