import * as fs from 'node:fs/promises';
import { AstMutator, CodeMutant } from './mutator.js';
import { LocalSandboxRunner } from '../sandbox/runner.js';
import chalk from 'chalk';

export interface MutationScoreResult {
  totalMutants: number;
  killedMutants: number;
  survivedMutants: number;
  mutationScore: number; // Percentuale da 0 a 100
  survivingMutantDetails: string[];
}

export class MutationEngine {
  private mutator: AstMutator;
  private sandbox: LocalSandboxRunner;

  constructor() {
    this.mutator = new AstMutator();
    this.sandbox = new LocalSandboxRunner();
  }

  async runMutationTesting(
    targetFilePath: string,
    testFilePath: string,
    workDir: string
  ): Promise<MutationScoreResult> {
    const originalCode = await fs.readFile(targetFilePath, 'utf-8');
    const mutants = this.mutator.generateMutants(originalCode);

    if (mutants.length === 0) {
      return {
        totalMutants: 0,
        killedMutants: 0,
        survivedMutants: 0,
        mutationScore: 100,
        survivingMutantDetails: [],
      };
    }

    let killed = 0;
    let survived = 0;
    const survivingDetails: string[] = [];

    console.log(chalk.yellow(`\n🧬 [Mutation Testing] Valutazione robustezza test su ${mutants.length} mutanti AST...`));

    try {
      for (const m of mutants) {
        // Applichiamo il mutante temporaneamente sul file target
        await fs.writeFile(targetFilePath, m.mutatedCode, 'utf-8');

        // Eseguiamo la suite di test PBT
        const res = await this.sandbox.runTest({
          workDir,
          testFilePath,
          targetFilePath,
        });

        // Se il test FALLISCE, il mutante è stato "ucciso" (comportamento corretto: i test hanno beccato il bug iniettato!)
        if (!res.passed) {
          killed++;
          console.log(chalk.gray(`  ✔ Ucciso: ${m.id} (${m.description})`));
        } else {
          // Se il test PASSA, il mutante è "sopravvissuto" (allarme: i test non sono abbastanza severi!)
          survived++;
          survivingDetails.push(`${m.id}: ${m.description}`);
          console.log(chalk.red(`  ⚠️ SOPRAVVISSUTO: ${m.id} (${m.description})`));
        }
      }
    } finally {
      // Ripristiniamo SEMPRE il codice originale
      await fs.writeFile(targetFilePath, originalCode, 'utf-8');
    }

    const mutationScore = Math.round((killed / mutants.length) * 100);
    console.log(chalk.bold.cyan(`\n📊 Mutation Score Finale: ${mutationScore}% (${killed}/${mutants.length} mutanti neutralizzati)`));

    return {
      totalMutants: mutants.length,
      killedMutants: killed,
      survivedMutants: survived,
      mutationScore,
      survivingMutantDetails: survivingDetails,
    };
  }
}
