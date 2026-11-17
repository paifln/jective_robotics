export function toSeconds(milliseconds: number): number {
  return milliseconds / 1000;
}

export function toMilliseconds(seconds: number): number {
  const milliseconds = seconds * 1000;
  const rounded = Math.round(milliseconds);
  return Math.abs(milliseconds - rounded) < 1e-6 ? rounded : milliseconds;
}

export function secondsText(milliseconds: number | null | undefined): number | string {
  return milliseconds == null ? '—' : toSeconds(milliseconds);
}
