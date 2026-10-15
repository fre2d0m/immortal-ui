/** Keep the first-paint foreground and WebGL camera in the same coordinate frame. */
export const HERO_SCENE_LAYOUT = {
  worldWidth: 14.6,
  cameraY: 5.2,
  cameraZ: 14,
  targetY: .72,
  groundY: -1.25,
} as const;

export function getMeadowGroundY(width: number, height: number) {
  const { cameraY, cameraZ, targetY, groundY, worldWidth } = HERO_SCENE_LAYOUT;
  const upY = cameraZ / Math.hypot(cameraZ, cameraY - targetY);
  return height / 2 + (targetY - groundY) * upY * width / worldWidth;
}
