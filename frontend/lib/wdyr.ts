/**
 * why-did-you-render — React Re-render Debugger
 * 
 * Logs to console whenever a React component re-renders unnecessarily.
 * This helps identify wasted renders in the analysis page's 40+ components.
 * 
 * Only active in development mode.
 * 
 * Usage: Import this file at the top of layout.tsx (before any component imports)
 * 
 * To track specific components, add this to the component:
 *   MyComponent.whyDidYouRender = true;
 * 
 * @see https://github.com/welldone-software/why-did-you-render
 */
import React from 'react';

import { env } from './config/env';

if (typeof window !== 'undefined' && env.app.isDevelopment) {
    // Dynamic import to avoid bundling in production
    import('@welldone-software/why-did-you-render').then((whyDidYouRenderModule) => {
        const whyDidYouRender = whyDidYouRenderModule.default;
        whyDidYouRender(React, {
            trackAllPureComponents: false,  // Set to true for aggressive tracking
            trackHooks: true,               // Track hook-related re-renders
            logOnDifferentValues: true,      // Log when values actually changed
            collapseGroups: true,            // Collapse console groups
            // Track specific components by adding .whyDidYouRender = true to them
            // Example: AnalysisStatusBanner.whyDidYouRender = true;
        });
        console.log('🔍 why-did-you-render initialized. Add .whyDidYouRender = true to components you want to track.');
    }).catch(() => {
        // Silently ignore if package not available
    });
}

export { };
