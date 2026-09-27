// One complete sunrise-to-sunrise cycle takes ten minutes of active play.
export const DAY_DURATION = 600;
export const START_TIME = 0.35;

export function advanceTime(time: number, seconds: number) {
  return ((time + seconds / DAY_DURATION) % 1 + 1) % 1;
}

export function daylight(time: number) {
  const angle = (time - 0.25) * Math.PI * 2;
  const altitude = Math.sin(angle);
  const t = Math.max(0, Math.min(1, (altitude + 0.15) / 0.5));
  return {
    x: Math.cos(angle), y: altitude,
    brightness: t * t * (3 - 2 * t),
    twilight: Math.max(0, 1 - Math.abs(altitude) / 0.3),
  };
}
