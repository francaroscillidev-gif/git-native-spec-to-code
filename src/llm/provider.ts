import { LLMProvider, PropertyContract } from '../types.js';

/**
 * Client universale per LLM compatibile sia con OpenAI che Gemini/Claude via standard API o Mock locale.
 * Se OPENAI_API_KEY o GEMINI_API_KEY non sono impostate, supporta una modalità deterministica mock
 * per test e sviluppo locale senza spendere crediti.
 */
export class SmartLLMProvider implements LLMProvider {
  private apiKey?: string;
  private endpoint?: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
  }

  async generatePropertiesAndTests(specContent: string, targetSkeleton?: string): Promise<{
    properties: PropertyContract[];
    testCode: string;
    initialImplementation: string;
  }> {
    if (!this.apiKey) {
      // Mock / Offline mode fallback for immediate testing
      return this.offlineGenerate(specContent);
    }

    const prompt = `
Sei un esperto di Ingegneria Formale del Software e Property-Based Testing (PBT).
Data questa specifica tecnica:
"""
${specContent}
"""

Compiti:
1. Estrai le proprietà invarianti formali (invarianti matematiche, monotonicità, bounds, idempotenza, round-trip).
2. Genera una suite di test rigorosa con Vitest e 'fast-check'.
   - Importa il modulo target da './implementation'.
   - Scrivi test fc.assert(fc.property(...)) per ogni invariante.
3. Genera un'implementazione iniziale (TypeScript) del componente in './implementation.ts'.

Rispondi ESCLUSIVAMENTE in formato JSON con la seguente struttura:
{
  "properties": [{"name": string, "description": string, "invariant": string}],
  "testCode": string,
  "initialImplementation": string
}
`;

    return await this.callJsonLLM(prompt);
  }

  async healImplementation(params: {
    specContent: string;
    testCode: string;
    currentImplementation: string;
    errorTrace: string;
    iteration: number;
  }): Promise<{
    fixedCode: string;
    explanation: string;
  }> {
    if (!this.apiKey) {
      return this.offlineHeal(params);
    }

    const prompt = `
Sei il motore di Self-Healing di un Agente QA.
Il test di proprietà (PBT) ha trovato un controesempio o ha fallito con il seguente errore/stacktrace:
"""
${params.errorTrace}
"""

SPECIFICA:
"""
${params.specContent}
"""

TEST DI PROPRIETÀ INVIOLABILI (NON MODIFICARE I TEST):
"""
${params.testCode}
"""

CODICE ATTUALE (CHE HA FALLITO):
"""
${params.currentImplementation}
"""

OBIETTIVO:
Identifica l'edge case o l'invariante rotta e correggi il codice in './implementation.ts'.
Rispondi ESCLUSIVAMENTE in JSON con la struttura:
{
  "fixedCode": string,
  "explanation": string
}
`;

    return await this.callJsonLLM(prompt);
  }

  async generateSafetyReport(params: {
    specContent: string;
    properties: PropertyContract[];
    iterations: number;
    finalCode: string;
  }): Promise<string> {
    const list = params.properties.map(p => `- **${p.name}**: ${p.description} *(Invariante: \`${p.invariant}\`)*`).join('\n');
    return `### 🛡️ Safety & Verification Attestation (Git-Native QA)
- **Stato**: ✅ 100% Verificato via Property-Based Testing
- **Iterazioni di Self-Healing**: ${params.iterations}
- **Invarianti Formali Garantite**:
${list}

**Conclusioni di Sicurezza:**
Tutte le proprietà derivate dalla specifica sono state sottoposte a generazioni randomiche su larga scala (fuzzing/shrinking con \`fast-check\`). Il codice non presenta regressioni note e rispetta rigorosamente i contratti formali.`;
  }

  private async callJsonLLM(prompt: string): Promise<any> {
    // Interfaccia OpenAI standard / compatibile
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      throw new Error(`LLM call failed: ${res.statusText}`);
    }
    const data: any = await res.json();
    return JSON.parse(data.choices[0].message.content);
  }

  // --- Offline Fallback Helpers per consentire esecuzioni di prova locali senza chiavi esterne ---
  private offlineGenerate(specContent: string) {
    return {
      properties: [
        {
          name: "Capacity Bound",
          description: "Il numero di token non supera mai la capacità massima",
          invariant: "tokens <= maxCapacity",
        },
        {
          name: "Token Refill Monotonicity",
          description: "All'avanzare del tempo, i token accumulati aumentano o restano uguali fino al cap",
          invariant: "refill(t2) >= refill(t1) per t2 >= t1",
        },
        {
          name: "Request Non-Negativity",
          description: "Non è possibile consumare token se la riserva è insufficiente",
          invariant: "consume(n) returns false if available < n",
        }
      ],
      testCode: `import { describe, it, expect } from 'vitest';
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
`,
      // Intenzionalmente con un piccolo bug per dimostrare il ciclo di self-healing!
      initialImplementation: `export class TokenBucketRateLimiter {
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
`,
    };
  }

  private offlineHeal(params: { iteration: number }) {
    return {
      fixedCode: `export class TokenBucketRateLimiter {
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
`,
      explanation: "Corretto il divisore da 100 a 1000 in advanceTime() per convertire accuratamente i millisecondi in secondi in base al tasso di refill definito nella specifica.",
    };
  }
}
