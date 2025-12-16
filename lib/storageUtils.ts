/**
 * Debounced localStorage utilities to reduce write operations
 */

const debounceTimers: Map<string, NodeJS.Timeout> = new Map();

/**
 * Debounced localStorage.setItem to reduce write frequency
 * @param key - localStorage key
 * @param value - value to store (will be JSON stringified)
 * @param delay - debounce delay in ms (default: 300ms)
 */
export const setLocalStorageDebounced = <T>(
  key: string,
  value: T,
  delay: number = 300
): void => {
  // Clear existing timer for this key
  const existingTimer = debounceTimers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Set new timer
  const timer = setTimeout(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      debounceTimers.delete(key);
    } catch (error) {
      console.error(`Failed to save to localStorage (${key}):`, error);
    }
  }, delay);

  debounceTimers.set(key, timer);
};

/**
 * Get item from localStorage with type safety
 */
export const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Failed to read from localStorage (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Immediately flush all pending debounced writes for a key
 */
export const flushLocalStorage = (key: string): void => {
  const timer = debounceTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    debounceTimers.delete(key);
  }
};

/**
 * Flush all pending debounced writes
 */
export const flushAllLocalStorage = (): void => {
  debounceTimers.forEach((timer) => clearTimeout(timer));
  debounceTimers.clear();
};
