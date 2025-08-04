import React from 'react';
import { Button } from 'react-bootstrap';

export default function RecipeControls({ binConfigs, setBinConfigs, recipeName, existingNames, isEditing }) {

    const handleClear = () => {
        setBinConfigs(Array.from({ length: 12 }, () => ({ category: "", color: { name: "", hex: "" } })));
    };

    const getIncompleteBinIndices = () => {
        return binConfigs
            .map((bin, index) => {
                const hasColor = bin.color?.name && bin.color?.hex;
                const hasCategory = bin.category;
                return hasColor && hasCategory ? null : index + 1; // 1-indexed
            })
            .filter(idx => idx !== null);
    };

    const handleUpload = async () => {
        const missingBins = getIncompleteBinIndices();
        if (missingBins.length > 0) {
            alert(`Please complete selections for Bin${missingBins.length > 1 ? 's' : ''}: ${missingBins.join(", ")}`);
            return;
        }

        if (!recipeName.trim()) {
            alert("Please enter a recipe name before uploading.");
            return;
        }

        const payload = {
            name: recipeName.trim(),
            bins: binConfigs
        };

        try {
            const res = await fetch("/api/recipes/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (res.ok) {
                alert(`Upload successful: ${result.message}`);
            } else {
                alert(`Upload failed: ${result.error}`);
            }
        } catch (err) {
            alert(`Error uploading recipe: ${err.message}`);
        }
    };

    const isUploadDisabled = getIncompleteBinIndices().length > 0 || !recipeName.trim();

    const handleUploadWrapperClick = () => {
        if (isUploadDisabled) {
            const missingBins = getIncompleteBinIndices();
            let message = "";
            if (!recipeName.trim()) {
                message += "Please enter a recipe name.\n";
            }
            if (missingBins.length > 0) {
                message += `Please complete selections for Bin${missingBins.length > 1 ? 's' : ''}: ${missingBins.join(", ")}`;
            }
            alert(message.trim());
        } else {
            handleUpload();
        }
    };

    return (
        <div className="mb-4 d-flex gap-2">
            <div onClick={handleUploadWrapperClick}>
                <Button variant="success" disabled={isUploadDisabled}>
                    Upload Recipe
                </Button>
            </div>
            <Button variant="secondary" onClick={handleClear}>
                Clear
            </Button>
        </div>
    );
}
