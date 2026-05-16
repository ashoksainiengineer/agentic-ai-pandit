// Debug utilities for Analysis Page
// Use in browser console: window.debugAnalysis

interface StreamStore {
  __STREAM_STORE__?: { getState?: () => Record<string, unknown> };
}

type PerformanceWithMemory = Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } };

export const debugAnalysis = {
  // Log current stream state
  logStreamState: () => {
    const state = (window as unknown as StreamStore).__STREAM_STORE__?.getState?.() || {};
    const ss = state as Record<string, unknown>;
    console.group('📊 Analysis Stream State');
    console.log('Connection:', ss.connectionStatus);
    console.log('Stage:', ss.currentStage);
    console.log('Progress:', `${ss.progress}%`);
    console.log('Active Stage:', ss.activeAIStage);
    const candidatesByStage = (ss.candidatesByStage || {}) as Record<string, Record<string, unknown>>;
    console.log('Candidates by Stage:', Object.keys(candidatesByStage).map(stage => ({
      stage,
      count: Object.keys(candidatesByStage[stage] || {}).length
    })));
    console.log('Total Candidates:', Object.values(candidatesByStage).reduce((acc: number, stage) => 
      acc + Object.keys(stage).length, 0
    ));
    console.log('Store Size:', JSON.stringify(state).length / 1024, 'KB');
    console.groupEnd();
    return state;
  },

  // Check memory usage
  checkMemory: () => {
    if ('memory' in performance) {
      const mem = (performance as unknown as PerformanceWithMemory).memory;
      if (!mem) { console.log('Memory API not available'); return; }
      console.group('🧠 Memory Usage');
      console.log('Used JS Heap:', (mem.usedJSHeapSize / 1048576).toFixed(2), 'MB');
      console.log('Total JS Heap:', (mem.totalJSHeapSize / 1048576).toFixed(2), 'MB');
      console.log('JS Heap Limit:', (mem.jsHeapSizeLimit / 1048576).toFixed(2), 'MB');
      console.log('Usage %:', ((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100).toFixed(2), '%');
      console.groupEnd();
      return mem;
    }
    console.log('Memory API not available');
  },

  // Monitor SSE connection
  monitorSSE: () => {
    const events: Array<Record<string, unknown>> = [];
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [url] = args;
      if (typeof url === 'string' && url.includes('/api/stream/')) {
        console.log('🔌 SSE Connection attempt:', url);
        events.push({ time: Date.now(), type: 'connect', url });
      }
      return originalFetch.apply(window, args);
    };

    console.log('SSE monitoring started. Events logged to window.sseEvents');
    (window as unknown as Record<string, unknown>).sseEvents = events;
    return events;
  },

  // Check for React render issues
  checkRenders: () => {
    let renderCount = 0;
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure' && entry.name.includes('⚛️')) {
          renderCount++;
          if (entry.duration > 16) {
            console.warn(`🐌 Slow render detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
          }
        }
      }
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    setTimeout(() => {
      console.log(`📈 Total renders in last 10s: ${renderCount}`);
      observer.disconnect();
    }, 10000);
  },

  // Inspect specific candidate
  inspectCandidate: (stage: string, time: string) => {
    const state = (window as unknown as StreamStore).__STREAM_STORE__?.getState?.() || {};
    const ss = state as Record<string, Record<string, Record<string, unknown>>>;
    const candidate = ss.candidatesByStage?.[stage]?.[time] as Record<string, unknown> | undefined;
    if (candidate) {
      console.group(`🔍 Candidate: ${time} (Stage: ${stage})`);
      console.log('Full Text Length:', (candidate.fullText as string)?.length || 0);
      console.log('Last Updated:', new Date(candidate.updatedAt as string).toLocaleTimeString());
      const scores = (ss.candidateScores || []) as unknown as Array<{ time: string; score?: number }>;
      console.log('Score:', scores.find((c) => c.time === time)?.score || 'N/A');
      console.log('Preview:', (candidate.fullText as string)?.substring(0, 200) + '...');
      console.groupEnd();
      return candidate;
    }
    console.log('Candidate not found');
  },

  // Get all errors from store
  getErrors: () => {
    const state = (window as unknown as StreamStore).__STREAM_STORE__?.getState?.() || {};
    const ss = state as Record<string, unknown>;
    console.group('❌ Errors');
    console.log('Connection Error:', ss.connectionError);
    console.log('Stream Error:', ss.streamError);
    console.log('Last Error:', ss.lastError);
    console.groupEnd();
    return {
      connectionError: ss.connectionError,
      streamError: ss.streamError,
      lastError: ss.lastError
    };
  }
};

// Auto-attach to window
declare global {
  interface Window {
    debugAnalysis: typeof debugAnalysis;
    sseEvents: Array<Record<string, unknown>>;
    __STREAM_STORE__: Record<string, unknown>;
  }
}

if (typeof window !== 'undefined') {
  window.debugAnalysis = debugAnalysis;
  console.log('🔧 Debug utilities loaded. Use debugAnalysis.logStreamState()');
}