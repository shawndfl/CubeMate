export const SETTINGS_KEY = 'cubemate.settings.v1';
export const DEFAULT_SENSITIVITY = 1;

export function parseSensitivity(raw: string | null): number {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (!value || typeof value !== 'object' || !('sensitivity' in value)) return DEFAULT_SENSITIVITY;
    const sensitivity = value.sensitivity;
    return typeof sensitivity === 'number' && Number.isFinite(sensitivity) && sensitivity >= 0.1 && sensitivity <= 3
      ? sensitivity : DEFAULT_SENSITIVITY;
  } catch { return DEFAULT_SENSITIVITY; }
}

export function storeSensitivity(sensitivity: number): boolean {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ sensitivity }));
    return true;
  } catch { return false; }
}
