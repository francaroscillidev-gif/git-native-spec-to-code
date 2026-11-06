export class TokenBucketRateLimiter {
  private capacity: number;
  private refillRate: number; // token al secondo
  private tokens: number;
  private lastRefillMs: number = 0;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
  }

  getTokens(): number {
    return this.tokens;
  }

  advanceTime(ms: number): void {
    // BUG INTENZIONALE: non calcola correttamente i millisecondi (divide per 100 invece di 1000)
    const addedTokens = Math.floor((ms / 100) * this.refillRate);
    this.tokens = Math.min(this.capacity, this.tokens + addedTokens);
  }

  tryConsume(cost: number): boolean {
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }
    return false;
  }
}
