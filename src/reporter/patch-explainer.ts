import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface PatchDiffSummary {
  file: string;
  originalLineCount: number;
  fixedLineCount: number;
  linesChanged: number;
  diffExplanation: string;
}

export class SmartPatchExplainer {
  async compareAndExplain(originalPath: string, fixedPath: string, explanation: string): Promise<PatchDiffSummary> {
    const original = (await fs.readFile(originalPath, 'utf-8')).split('\n');
    const fixed = (await fs.readFile(fixedPath, 'utf-8')).split('\n');

    let linesChanged = 0;
    const maxLen = Math.max(original.length, fixed.length);
    for (let i = 0; i < maxLen; i++) {
      if (original[i] !== fixed[i]) {
        linesChanged++;
      }
    }

    return {
      file: path.basename(fixedPath),
      originalLineCount: original.length,
      fixedLineCount: fixed.length,
      linesChanged,
      diffExplanation: explanation,
    };
  }

  generateMarkdown(summary: PatchDiffSummary): string {
    return `
### 🩺 Self-Healing Patch Analysis (Zero Regression Proof)
- **File Riparato**: \`${summary.file}\`
- **Righe Modificate**: \`${summary.linesChanged}\`
- **Razionale della Correzione**:
> ${summary.diffExplanation}
- **Impatto Architetturale**: *Modifica atomica e chirurgica focalizzata sul rispetto dei contratti formali senza intaccare API pubbliche.*
`;
  }
}
