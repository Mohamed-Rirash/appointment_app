"use client"

import { useEffect, useState } from "react";

export default function useLocalStorage(key: string, initialValue: boolean) {
  const [storedValue, setStoredValue] = useState(initialValue);
  
  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) setStoredValue(JSON.parse(item));
    } catch (error) {
      console.warn(`Error reading ${key} from localStorage:`, error);
    }
  }, [key]);

  const setValue = (value: boolean | ((val: boolean) => boolean)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting ${key} to localStorage:`, error);
    }
  };

  return [storedValue, setValue] as const;
}
