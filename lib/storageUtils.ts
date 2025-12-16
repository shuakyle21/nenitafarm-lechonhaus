/**
 * Debounced localStorage utilities to reduce write operations
 */

const debounceTimers: Map<string, NodeJS.Timeout> = new Map();
const pendingWrites: Map<string, any> = new Map();

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

  // Store the pending value
  pendingWrites.set(key, value);

  // Set new timer
  const timer = setTimeout(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      debounceTimers.delete(key);
      pendingWrites.delete(key);
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
 * Immediately write a pending debounced value to localStorage
 * Cancels the timer and writes the data immediately
 */
export const flushLocalStorage = (key: string): void => {
  const timer = debounceTimers.get(key);
  const value = pendingWrites.get(key);
  
  if (timer) {
    clearTimeout(timer);
    debounceTimers.delete(key);
  }
  
  if (value !== undefined) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      pendingWrites.delete(key);
    } catch (error) {
      console.error(`Failed to flush to localStorage (${key}):`, error);
    }
  }
};

/**
 * Flush all pending debounced writes to localStorage
 * Writes all pending data immediately and clears all timers
 */
export const flushAllLocalStorage = (): void => {
  // Write all pending values
  pendingWrites.forEach((value, key) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to flush to localStorage (${key}):`, error);
    }
  });
  
  // Clear all timers and pending writes
  debounceTimers.forEach((timer) => clearTimeout(timer));
  debounceTimers.clear();
  pendingWrites.clear();
};
