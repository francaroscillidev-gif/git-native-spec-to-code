export class TokenBucketRateLimiter {
  private capacity: number;
  private refillRate: number; // token al secondo
  private tokens: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
  }

  getTokens(): number {
    return this.tokens;
  }

  advanceTime(ms: number): void {
    // FIX APPLICATO: conversione corretta da ms a secondi (/ 1000) e capping a capacity
    const addedTokens = Math.floor((ms / 1000) * this.refillRate);
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
