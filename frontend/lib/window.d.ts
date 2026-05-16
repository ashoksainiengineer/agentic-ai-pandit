export {};

declare global {
  interface Window {
    __AI_PANDIT_TEST_MODE__?: boolean;
    __clerk?: {
      session?: {
        getToken(): Promise<string | null>;
      };
    };
    useStreamStore?: unknown;
  }
}
