/** Advances a looping atlas animation while keeping a stable frame index. */
export class LavaAnimation {
  static readonly secondsPerFrame = 1.0;
  static readonly frameCount = 4;
  private elapsed = 0;
  private currentFrame = 0;

  get frame() {
    return this.currentFrame;
  }

  advance(seconds: number) {
    const div = LavaAnimation.secondsPerFrame * LavaAnimation.frameCount;
    this.elapsed = (this.elapsed + Math.max(0, seconds)) % div;
    const nextFrame = Math.floor(this.elapsed / LavaAnimation.secondsPerFrame);
    if (nextFrame === this.currentFrame) return false;
    this.currentFrame = nextFrame;
    return true;
  }
}
