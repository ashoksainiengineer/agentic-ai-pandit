// Frontend-compatible ephemeris utilities

export function isHighPrecisionMode(): boolean {
  // Frontend relies on backend Skyfield service for high-precision calculations
  return false;
}

export function getEphemerisMode(): string {
  return 'algorithmic';
}
