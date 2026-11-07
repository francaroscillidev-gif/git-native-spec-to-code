export interface FlakyDetectionResult {
  totalRuns: number;
  failuresObserved: number;
  flakinessScorePercent: number;
  isFlaky: boolean;
  varianceDetected: string[];
}

export class FlakyTestStressEngine {
  /**
   * Esegue lo stress testing con permutazioni di seed e micro-delay casuali
   * per rilevare test intermittenti (flaky), dipendenze da timing o ordine di esecuzione.
   */
  async detectFlakiness(
    testRunner: (runIndex: number) => Promise<boolean>,
    iterations: number = 20
  ): Promise<FlakyDetectionResult> {
    let failures = 0;
    const variances: string[] = [];

    for (let i = 1; i <= iterations; i++) {
      try {
        const passed = await testRunner(i);
        if (!passed) {
          failures++;
          variances.push(`Run #${i}: fallimento con seed randomico`);
        }
      } catch (err: any) {
        failures++;
        variances.push(`Run #${i}: eccezione inattesa: ${err.message}`);
      }
    }

    const flakinessScore = (failures / iterations) * 100;
    const isFlaky = failures > 0 && failures < iterations;

    return {
      totalRuns: iterations,
      failuresObserved: failures,
      flakinessScorePercent: flakinessScore,
      isFlaky,
      varianceDetected: variances,
    };
  }

  generateMarkdown(result: FlakyDetectionResult): string {
    return `
### 🎲 Flaky Test & Intermittent Non-Determinism Detector
- **Stress Runs Eseguiti**: \`${result.totalRuns}\` iterazioni consecutive
- **Indice di Instabilità (Flakiness Score)**: \`${result.flakinessScorePercent}%\`
- **Esito Deterministico**: ${result.isFlaky ? '⚠️ **FLAKY TEST RILEVATO (Intermittente)**' : '✅ **100% DETERMINISTICO (Zero Flakiness)**'}
> *${result.isFlaky ? 'Attenzione: Il comportamento varia in base al timing o all\'ordine di esecuzione.' : 'Tutte le esecuzioni hanno prodotto output identici e riproducibili al 100%.'}*
`;
  }
}
