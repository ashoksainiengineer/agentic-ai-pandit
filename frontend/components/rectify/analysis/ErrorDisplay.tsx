'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw, ServerCrash } from 'lucide-react';

export function ErrorDisplay({ error, onRetry }: { error?: string, onRetry: () => void }) {
    const router = useRouter();

    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in duration-500">
            <div className="w-24 h-24 mb-6 rounded-full bg-red-500/10 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <ServerCrash className="h-10 w-10 text-red-500" />
            </div>

            <h2 className="text-3xl font-medium tracking-tight mb-3 text-red-500">Connection Error</h2>
            <p className="text-muted-foreground max-w-md text-center mb-8 text-lg">
                {error || 'Unable to establish a stable connection with the inference engine. The AI Pandit cluster might be under heavy load or restarting.'}
            </p>

            <div className="flex gap-4">
                <button
                    onClick={onRetry}
                    className="inline-flex items-center justify-center bg-black border border-black/20 hover:bg-black/80 text-white rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 gap-2 h-12 px-8"
                >
                    <RefreshCw className="h-5 w-5" /> Retry Connection
                </button>
                <button
                    className="inline-flex items-center justify-center border border-black/20 bg-transparent hover:bg-black/5 text-black rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 gap-2 h-12 px-8"
                    onClick={() => router.push('/dashboard')}
                >
                    Exit Analysis
                </button>
            </div>

            <div className="mt-12 max-w-sm p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex items-start gap-4">
                <div className="p-2 bg-red-500/20 rounded-lg shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div className="text-sm text-red-600/80">
                    <strong>Auto-Recovery Disabled:</strong> We detected multiple catastrophic failures. Please try again manually in a few moments.
                </div>
            </div>
        </div>
    );
}
