export class AiLatencyTracker {
  private readonly startedAt = performance.now();
  private readonly stages = new Map<string, number>();

  async measure<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startedAt = performance.now();
    try {
      return await operation();
    } finally {
      this.stages.set(name, Math.round(performance.now() - startedAt));
    }
  }

  snapshot() {
    return {
      totalMs: Math.round(performance.now() - this.startedAt),
      stages: Object.fromEntries(this.stages),
    };
  }
}
