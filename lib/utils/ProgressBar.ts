/**
 * Progress Bar Utility
 * 
 * Provides visual progress feedback during long operations
 */

import * as cliProgress from 'cli-progress';

export class ProgressBar {
  private bar: cliProgress.SingleBar | null = null;
  private enabled: boolean;

  constructor(enabled: boolean = true) {
    this.enabled = enabled && process.stdout.isTTY;
  }

  /**
   * Start progress bar
   */
  start(total: number, label: string = 'Progress'): void {
    if (!this.enabled || total === 0) {
      return;
    }

    this.bar = new cliProgress.SingleBar({
      format: `${label} [{bar}] {percentage}% | {value}/{total} {item}`,
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
      clearOnComplete: false,
      stopOnComplete: true
    }, cliProgress.Presets.shades_classic);

    this.bar.start(total, 0, { item: '' });
  }

  /**
   * Update progress
   */
  update(value: number, item: string = ''): void {
    if (!this.enabled || !this.bar) {
      return;
    }

    this.bar.update(value, { item });
  }

  /**
   * Increment progress
   */
  increment(item: string = ''): void {
    if (!this.enabled || !this.bar) {
      return;
    }

    this.bar.increment({ item });
  }

  /**
   * Stop progress bar
   */
  stop(): void {
    if (!this.enabled || !this.bar) {
      return;
    }

    this.bar.stop();
    this.bar = null;
  }

  /**
   * Create a simple progress tracker without bar
   */
  static createSimpleTracker(total: number, label: string = 'Progress'): {
    update: (current: number, item?: string) => void;
    complete: () => void;
  } {
    let lastPercent = 0;

    return {
      update: (current: number, item: string = '') => {
        const percent = Math.floor((current / total) * 100);
        // Only log at 10% intervals to avoid spam
        if (percent >= lastPercent + 10 || current === total) {
          console.log(`   ${label}: ${percent}% (${current}/${total}) ${item}`);
          lastPercent = percent;
        }
      },
      complete: () => {
        console.log(`   ${label}: ✓ Complete (${total}/${total})`);
      }
    };
  }
}

/**
 * Helper to run async operations with progress bar
 */
export async function withProgress<T>(
  items: T[],
  processor: (item: T, index: number) => Promise<void>,
  label: string = 'Processing'
): Promise<void> {
  const progress = new ProgressBar();
  progress.start(items.length, label);

  for (let i = 0; i < items.length; i++) {
    await processor(items[i], i);
    progress.increment(`item ${i + 1}`);
  }

  progress.stop();
}
