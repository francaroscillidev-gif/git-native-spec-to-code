import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface TimeTravelSnapshot {
  step: number;
  timestamp: string;
  action: 'INITIAL_SYNTHESIS' | 'SANDBOX_FAILURE' | 'SELF_HEALING_PATCH' | 'MUTATION_TESTING' | 'FORMAL_ATTESTATION';
  codeState: string;
  errorTrace?: string;
  counterexample?: string;
  diffSummary?: string;
}

export class TimeTravelDebuggerReplayer {
  private timeline: TimeTravelSnapshot[] = [];

  recordSnapshot(snapshot: Omit<TimeTravelSnapshot, 'step' | 'timestamp'>) {
    this.timeline.push({
      step: this.timeline.length + 1,
      timestamp: new Date().toISOString(),
      ...snapshot,
    });
  }

  getTimeline(): TimeTravelSnapshot[] {
    return this.timeline;
  }

  async exportJsonLog(outputPath: string): Promise<void> {
    await fs.writeFile(outputPath, JSON.stringify(this.timeline, null, 2), 'utf-8');
  }

  generateMarkdown(): string {
    const rows = this.timeline.map(s => {
      const details = s.counterexample ? `Controesempio: \`${s.counterexample}\`` : s.diffSummary || 'OK';
      return `| Step #${s.step} | \`${s.action}\` | ${details} | \`${s.timestamp.split('T')[1].replace('Z','')}\` |`;
    });

    return `
### ⏳ Time-Travel Self-Healing Timeline (Deterministic Replay)
- **Snapshot Storici Registrati**: \`${this.timeline.length}\`
- **Replay Deterministico**: Esportato in \`execution_replay.json\` per il debug post-mortem.

| Sequenza | Evento / Transizione | Dettaglio Chiave | Orario |
| :--- | :--- | :--- | :--- |
${rows.join('\n')}
`;
  }
}
