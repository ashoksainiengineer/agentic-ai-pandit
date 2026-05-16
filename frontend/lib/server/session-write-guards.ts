const PROTECTED_SESSION_FIELDS = new Set([
  'status',
  'analysisResult',
  'progressData',
  'rectifiedTime',
  'accuracy',
  'confidence',
  'errorMessage',
  'errorCode',
  'submittedAt',
  'startedProcessingAt',
  'completedAt',
  'reasoningLogs',
]);

const MUTABLE_SESSION_STATUSES = new Set(['draft', 'failed', 'pending']);

export function getProtectedFieldsPresent(payload: Record<string, unknown>): string[] {
  return Object.keys(payload).filter((key) => PROTECTED_SESSION_FIELDS.has(key));
}

export function canFrontendMutateSession(status: string | null | undefined): boolean {
  if (!status) return false;
  return MUTABLE_SESSION_STATUSES.has(status);
}
