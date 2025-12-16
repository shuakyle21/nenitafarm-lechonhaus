/**
 * Performance optimization utilities
 */

/**
 * Debounce function to limit how often a function is called
 * Useful for reducing localStorage write operations
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Memoize expensive computations
 * Cache results based on a simple key
 */
export function memoize<T>(
  fn: (...args: any[]) => T,
  getKey?: (...args: any[]) => string
): (...args: any[]) => T {
  const cache = new Map<string, T>();
  
  return (...args: any[]): T => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Batch multiple async operations with Promise.allSettled
 * Prevents overwhelming the system with sequential operations
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 5
): Promise<{ successful: R[]; failed: Array<{ item: T; error: any }> }> {
  const successful: R[] = [];
  const failed: Array<{ item: T; error: any }> = [];
  
  // Process in batches to avoid overwhelming the system
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((item, idx) => 
        processor(item).then(result => ({ item: items[i + idx], result }))
      )
    );
    
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value.result);
      } else {
        // Use the correct item from the batch
        failed.push({ item: batch[idx], error: result.reason });
      }
    });
  }
  
  return { successful, failed };
}
