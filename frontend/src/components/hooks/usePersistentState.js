import { useState, useEffect } from 'react';

export default function usePersistentState(key, initialValue) {
    const [value, setValue] = useState(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (err) {
            console.error(`Error reading localStorage key "${key}":`, err);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (err) {
            console.error(`Error writing localStorage key "${key}":`, err);
        }
    }, [key, value]);

    return [value, setValue];
}