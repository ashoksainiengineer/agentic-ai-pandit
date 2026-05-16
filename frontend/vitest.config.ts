import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

const envLocalPath = path.resolve(__dirname, '.env.local');
const envPath = path.resolve(__dirname, '.env');

if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        environmentOptions: {
            jsdom: { url: 'http://localhost/' }
        },
        include: ['lib/**/*.test.ts', 'hooks/**/*.test.ts', 'components/**/*.test.tsx', '__tests__/**/*.test.tsx'],
        exclude: ['node_modules', '.next'],
        setupFiles: ['./vitest.setup.ts', './__tests__/setup.ts'],
        pool: 'forks',
        forks: {
            singleFork: true,
        },
        retry: 2,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json-summary', 'lcov'],
            thresholds: {
                branches: 50,
                functions: 60,
                lines: 65,
                statements: 65,
            },
            exclude: ['node_modules', '.next', '**/*.test.*', '**/*.spec.*', '**/__tests__/**'],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
});
