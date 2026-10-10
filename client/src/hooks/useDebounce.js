/**
 * hooks/useDebounce.js
 * Delays updating a value until the user stops typing (or changing).
 * Useful for search inputs to avoid hammering the API on every keystroke.
 *
 * @param {*}      value - Value to debounce.
 * @param {number} delay - Delay in milliseconds (default 400ms).
 * @returns {*} Debounced value.
 */
import { useState, useEffect } from 'react';

const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
