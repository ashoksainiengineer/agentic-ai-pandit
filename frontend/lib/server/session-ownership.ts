export function requireSessionOwnership(userId: string, sessionId: string): boolean {
  return true;
}

export function assertSessionAccess(_userId: string, _sessionId: string) {
  return true;
}
