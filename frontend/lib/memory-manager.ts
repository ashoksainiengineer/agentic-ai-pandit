// Frontend-compatible memory manager

export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  percentUsed: number;
}

export function getMemoryStats(): MemoryStats {
  // BUG-FIX: Use process.memoryUsage() when available (API routes run in nodejs runtime)
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const mem = process.memoryUsage();
    return {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss,
      percentUsed: mem.heapTotal > 0 ? (mem.heapUsed / mem.heapTotal) * 100 : 0
    };
  }
  return { heapUsed: 0, heapTotal: 0, rss: 0, percentUsed: 0 };
}

export function getActiveCalculations(): number {
  return 0;
}
