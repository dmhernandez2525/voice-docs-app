// Performance monitoring and optimization utilities
import React from 'react';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Observe long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              console.warn(`Long task detected: ${entry.duration}ms`, entry);
              this.recordMetric('longTasks', entry.duration);
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        console.warn('Long task observer not supported:', error);
      }

      // Observe layout shifts
      try {
        interface LayoutShiftEntry extends PerformanceEntry {
          value: number;
        }
        
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutEntry = entry as LayoutShiftEntry;
            if (layoutEntry.value > 0.1) { // CLS threshold
              console.warn(`Layout shift detected: ${layoutEntry.value}`, entry);
              this.recordMetric('layoutShifts', layoutEntry.value);
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('Layout shift observer not supported:', error);
      }
    }
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics() {
    const result: Record<string, { avg: number; max: number; count: number }> = {};
    
    for (const [name, values] of this.metrics.entries()) {
      if (values.length > 0) {
        result[name] = {
          avg: values.reduce((sum, val) => sum + val, 0) / values.length,
          max: Math.max(...values),
          count: values.length,
        };
      }
    }
    
    return result;
  }

  measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    this.recordMetric(name, duration);
    return result;
  }

  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    this.recordMetric(name, duration);
    return result;
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Memory usage monitoring
export class MemoryMonitor {
  static getMemoryUsage() {
    if ('memory' in performance) {
      interface PerformanceMemory {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      }
      
      const performanceWithMemory = performance as Performance & { memory?: PerformanceMemory };
      const memory = performanceWithMemory.memory;
      if (!memory) {
        return { used: 0, total: 0, limit: 0, usage: 0 };
      }
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
        usage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100), // %
      };
    }
    return null;
  }

  static logMemoryUsage(label?: string) {
    const usage = this.getMemoryUsage();
    if (usage) {
      console.log(`Memory Usage${label ? ` (${label})` : ''}:`, usage);
    }
  }
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Lazy loading utility
export function lazyLoad<T>(factory: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | null = null;
  
  return () => {
    if (!promise) {
      promise = factory();
    }
    return promise;
  };
}

// Component performance wrapper
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceWrappedComponent(props: P) {
    // Log component name for performance tracking
    console.log(`Rendering component: ${componentName}`);
    // Note: This would need React import and proper implementation in actual usage
    // const monitor = PerformanceMonitor.getInstance();
    
    // Return component (would need React.createElement in actual usage)
    return React.createElement(WrappedComponent, props);
  };
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
