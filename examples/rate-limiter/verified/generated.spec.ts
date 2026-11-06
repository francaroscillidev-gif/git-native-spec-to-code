import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { TokenBucketRateLimiter } from './implementation.js';

describe('Property-Based Verification: TokenBucketRateLimiter', () => {
  it('Property 1: Capacity Bound & Non-negativity', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // capacity
        fc.integer({ min: 1, max: 100 }),  // refillRate
        fc.array(fc.integer({ min: 1, max: 50 })), // requests
        (capacity, refillRate, requests) => {
          const limiter = new TokenBucketRateLimiter(capacity, refillRate);
          for (const req of requests) {
            const allowed = limiter.tryConsume(req);
            const tokens = limiter.getTokens();
            expect(tokens).toBeGreaterThanOrEqual(0);
            expect(tokens).toBeLessThanOrEqual(capacity);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2: Refill Invariant over Time', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 100 }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 5000 }),
        (capacity, refillRate, elapsedMs) => {
          const limiter = new TokenBucketRateLimiter(capacity, refillRate);
          limiter.tryConsume(capacity); // svuota tutto
          limiter.advanceTime(elapsedMs);
          const expectedTokens = Math.min(capacity, Math.floor((elapsedMs / 1000) * refillRate));
          expect(limiter.getTokens()).toBe(expectedTokens);
        }
      ),
      { numRuns: 100 }
    );
  });
});
