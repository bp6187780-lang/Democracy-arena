/**
 * Performance utilities for optimized rendering and interaction
 */

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  return function (this: any, ...args: Parameters<T>) {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => {
      func.apply(this, args);
      timeout = null;
    }, wait);
  };
}

/**
 * Request animation frame with fallback
 */
export const raf =
  typeof requestAnimationFrame !== 'undefined'
    ? requestAnimationFrame
    : (callback: FrameRequestCallback) => setTimeout(callback, 16);

export const caf =
  typeof cancelAnimationFrame !== 'undefined'
    ? cancelAnimationFrame
    : clearTimeout;

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map<string, ReturnType<T>>();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Performance monitor
 */
export class PerformanceMonitor {
  private frames: number[] = [];
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;

  update(): void {
    const now = performance.now();
    if (this.lastTime) {
      const delta = now - this.lastTime;
      this.frames.push(delta);
      if (this.frames.length > 60) {
        this.frames.shift();
      }
      this.frameCount++;
      if (this.frameCount % 10 === 0) {
        const avgDelta =
          this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
        this.fps = 1000 / avgDelta;
      }
    }
    this.lastTime = now;
  }

  getFPS(): number {
    return Math.round(this.fps);
  }

  reset(): void {
    this.frames = [];
    this.lastTime = 0;
    this.frameCount = 0;
    this.fps = 0;
  }
}

/**
 * Check for reduced motion preference
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Batch DOM reads and writes
 */
export class DOMBatcher {
  private readQueue: Array<() => void> = [];
  private writeQueue: Array<() => void> = [];
  private scheduled: boolean = false;

  read(callback: () => void): void {
    this.readQueue.push(callback);
    this.schedule();
  }

  write(callback: () => void): void {
    this.writeQueue.push(callback);
    this.schedule();
  }

  private schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    raf(() => this.flush());
  }

  private flush(): void {
    // Execute all reads first
    while (this.readQueue.length) {
      const read = this.readQueue.shift();
      if (read) read();
    }

    // Then all writes
    while (this.writeQueue.length) {
      const write = this.writeQueue.shift();
      if (write) write();
    }

    this.scheduled = false;
  }
}
