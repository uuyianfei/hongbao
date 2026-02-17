import { MorseTimeline, MorseEvent } from '../services/api';

/**
 * 使用 Web Audio API 播放摩斯密码音频
 */
export class MorseAudioPlayer {
  private audioContext: AudioContext | null = null;
  private isPlaying = false;
  private timeoutIds: number[] = [];

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  /**
   * 播放摩斯密码时序
   */
  async play(timeline: MorseTimeline, onProgress?: (progress: number) => void): Promise<void> {
    this.stop();
    this.isPlaying = true;

    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const startTime = ctx.currentTime;
    const totalDuration = timeline.totalDuration / 1000;

    // 为每个音调事件创建音频节点
    for (const event of timeline.events) {
      if (!this.isPlaying) break;

      const eventStart = startTime + event.start / 1000;
      const eventDuration = event.duration / 1000;

      // 创建振荡器
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(700, eventStart); // 700Hz 是经典摩斯电报频率

      // 平滑的音量包络以避免爆音
      gainNode.gain.setValueAtTime(0, eventStart);
      gainNode.gain.linearRampToValueAtTime(0.5, eventStart + 0.005);
      gainNode.gain.setValueAtTime(0.5, eventStart + eventDuration - 0.005);
      gainNode.gain.linearRampToValueAtTime(0, eventStart + eventDuration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(eventStart);
      oscillator.stop(eventStart + eventDuration);
    }

    // 进度跟踪
    if (onProgress) {
      const updateProgress = () => {
        if (!this.isPlaying) return;
        const elapsed = (ctx.currentTime - startTime) / totalDuration;
        const progress = Math.min(elapsed, 1);
        onProgress(progress);

        if (progress < 1) {
          const id = window.requestAnimationFrame(updateProgress);
          this.timeoutIds.push(id);
        }
      };
      updateProgress();
    }

    // 等待播放完成
    return new Promise((resolve) => {
      const waitTime = timeline.totalDuration + 100;
      const id = window.setTimeout(() => {
        this.isPlaying = false;
        if (onProgress) onProgress(1);
        resolve();
      }, waitTime);
      this.timeoutIds.push(id);
    });
  }

  /**
   * 停止播放
   */
  stop(): void {
    this.isPlaying = false;
    for (const id of this.timeoutIds) {
      window.clearTimeout(id);
      window.cancelAnimationFrame(id);
    }
    this.timeoutIds = [];
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.stop();
  }
}
