/**
 * Debounced localStorage writer to reduce blocking I/O operations
 * Batches multiple writes into a single operation after a delay
 */

type PendingWrite = {
  key: string;
  value: string;
  timeoutId: NodeJS.Timeout;
};

const pendingWrites = new Map<string, PendingWrite>();

/**
 * Write to localStorage with debouncing
 * @param key - localStorage key
 * @param value - Value to store (will be JSON.stringified)
 * @param delay - Debounce delay in ms (default: 300ms)
 */
export const debouncedSetItem = <T>(key: string, value: T, delay: number = 300): void => {
  // Clear existing timeout for this key
  const existing = pendingWrites.get(key);
  if (existing) {
    clearTimeout(existing.timeoutId);
  }

  // Schedule new write
  const timeoutId = setTimeout(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      pendingWrites.delete(key);
    } catch (error) {
      console.error(`Failed to write to localStorage (${key}):`, error);
    }
  }, delay);

  pendingWrites.set(key, {
    key,
    value: JSON.stringify(value),
    timeoutId,
  });
};

/**
 * Immediately flush all pending writes to localStorage
 * Useful before critical operations like page unload
 */
export const flushPendingWrites = (): void => {
  pendingWrites.forEach((pending) => {
    clearTimeout(pending.timeoutId);
    try {
      localStorage.setItem(pending.key, pending.value);
    } catch (error) {
      console.error(`Failed to flush localStorage (${pending.key}):`, error);
    }
  });
  pendingWrites.clear();
};

/**
 * Read from localStorage with error handling
 * @param key - localStorage key
 * @param defaultValue - Default value if read fails
 * @returns Parsed value or defaultValue
 */
export const getItem = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Failed to read from localStorage (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Remove item from localStorage
 * @param key - localStorage key
 */
export const removeItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
    // Also cancel any pending writes
    const pending = pendingWrites.get(key);
    if (pending) {
      clearTimeout(pending.timeoutId);
      pendingWrites.delete(key);
    }
  } catch (error) {
    console.error(`Failed to remove from localStorage (${key}):`, error);
  }
};

// Flush pending writes before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushPendingWrites);
}
