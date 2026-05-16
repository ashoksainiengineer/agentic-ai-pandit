// vitest.setup.ts
import '@testing-library/jest-dom';

// Set environment variables needed by crypto module
process.env.ENCRYPTION_SECRET = 'test-secret-key-for-vitest-testing-32chars!';
process.env.NEXT_PHASE = 'phase-development-build';
