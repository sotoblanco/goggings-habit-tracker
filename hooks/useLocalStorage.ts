import { useState, Dispatch, SetStateAction } from 'react';

// FIX: Update useLocalStorage to support primitive types by removing the 'extends object' constraint on T.
// This allows the hook to be used for storing booleans, numbers, and strings, fixing compilation errors
// in components that were using it for simple state like 'isOpen'. The logic is also updated to correctly
// handle both object merging (for schema updates) and primitive value storage.
function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsedItem = JSON.parse(item);
        // If initialValue is an object, perform a merge to handle schema updates gracefully.
        if (typeof initialValue === 'object' && initialValue !== null && !Array.isArray(initialValue) &&
            typeof parsedItem === 'object' && parsedItem !== null && !Array.isArray(parsedItem)) {
          return { ...initialValue as object, ...parsedItem };
        }
        // For primitives, arrays, or if types don't align for merging, return the stored value.
        return parsedItem;
      }
      return initialValue;
    } catch (error) {
      console.error("Error reading from localStorage, resetting to initial value:", error);
      // If parsing fails (e.g., corrupted data), return the fresh initial value.
      return initialValue;
    }
  });

  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    try {
      // Use the functional update form of useState's setter to ensure we have the latest state.
      setStoredValue(currentState => {
        const valueToStore =
          value instanceof Function ? value(currentState) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;
