/**
 * Simple className merging utility.
 * Filters out falsy values and joins with spaces.
 * No tailwind-merge dependency — relies on Tailwind's layer ordering.
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}
