// Browser Extension Recommendations for AI-Pandit Debugging

/**
 * Required Browser Extensions:
 * 
 * 1. React Developer Tools
 *    - Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/
 *    - Firefox: https://addons.mozilla.org/firefox/addon/react-devtools/
 *    - Features: Component tree, props/state inspection, profiler, highlight updates
 * 
 * 2. Redux DevTools
 *    - Chrome: https://chrome.google.com/webstore/detail/redux-devtools/
 *    - Why: Zustand uses Redux DevTools extension for time-travel debugging
 * 
 * 3. SSE Debug (for streaming)
 *    - Chrome: https://chrome.google.com/webstore/detail/sse-debug/
 *    - Alternative: Use Network tab filter "eventsource"
 * 
 * 4. JSONVue
 *    - Chrome: https://chrome.google.com/webstore/detail/jsonvue/
 *    - Why: Better JSON formatting for API responses
 * 
 * 5. Lighthouse
 *    - Built into Chrome DevTools
 *    - Why: Performance auditing
 * 
 * 6. Web Vitals Extension
 *    - Chrome: https://chrome.google.com/webstore/detail/web-vitals/
 *    - Why: Real-time Core Web Vitals monitoring
 */

interface DevToolsWindow {
  __REACT_DEVTOOLS_GLOBAL_HOOK__?: unknown;
  __REDUX_DEVTOOLS_EXTENSION__?: unknown;
  __ZUSTAND_DEVTOOLS__?: unknown;
}

export const extensionSetup = {
  // Check if extensions are installed
  checkExtensions: () => {
    const devWindow = window as unknown as DevToolsWindow;
    const checks = {
      react: !!devWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__,
      redux: !!devWindow.__REDUX_DEVTOOLS_EXTENSION__,
      zustand: !!devWindow.__ZUSTAND_DEVTOOLS__
    };
    
    console.group('🔌 Browser Extensions');
    Object.entries(checks).forEach(([name, installed]) => {
      console.log(`${installed ? '✅' : '❌'} ${name}`);
    });
    console.groupEnd();
    
    return checks;
  }
};