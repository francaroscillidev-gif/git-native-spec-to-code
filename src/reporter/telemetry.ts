export interface FuzzRunMetrics {
  totalFuzzCases: number;
  seed: number;
  durationMs: number;
  exploredRanges: {
    property: string;
    casesGenerated: number;
    shrunkIterations?: number;
    counterexample?: string;
  }[];
}

export class FuzzingTelemetryTracker {
  generateAsciiChart(metrics: FuzzRunMetrics): string {
    const rows = metrics.exploredRanges.map(r => {
      const barLength = Math.min(25, Math.max(3, Math.floor(r.casesGenerated / 4)));
      const bar = '█'.repeat(barLength) + '░'.repeat(Math.max(0, 25 - barLength));
      return `| \`${r.property.padEnd(28)}\` | \`${bar}\` | ${r.casesGenerated} casi | ${r.shrunkIterations ?? 0} shrink |`;
    });

    return `
### 📊 Fuzzing & Shrinking Telemetry Dashboard
- **Totale Input Sintetizzati**: ${metrics.totalFuzzCases.toLocaleString()} permutazioni
- **Seed Deterministico Riproducibile**: \`${metrics.seed}\`
- **Tempo di Esplorazione**: \`${metrics.durationMs}ms\`

| Proprietà Testata | Distribuzione Input Esplorati | Volumetria | Controesempi Ridotti |
| :--- | :--- | :--- | :--- |
${rows.join('\n')}
`;
  }
}
