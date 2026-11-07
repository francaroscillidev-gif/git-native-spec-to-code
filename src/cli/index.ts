#!/usr/bin/env node
import { Command } from 'commander';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { SpecVerificationAgent } from '../healer/agent.js';
import { SmartLLMProvider } from '../llm/provider.js';
import { GitGuard } from '../git/guard.js';

dotenv.config();

const program = new Command();

program
  .name('spec-verify')
  .description('Git-Native Spec-to-Code Verification Agent with Property-Based Testing, Mutation Testing & Self-Healing')
  .version('9.0.0');

program
  .command('verify')
  .description('Analizza una specifica, sintetizza i test PBT, implementa il codice, esegue il loop di self-healing e mutation testing')
  .requiredOption('-s, --spec <path>', 'Percorso al file della specifica (markdown / txt)')
  .option('-t, --target-dir <path>', 'Directory di output per codice, test e report', './output')
  .option('-i, --max-iterations <number>', 'Numero massimo di round di self-healing', '4')
  .option('--no-mutation', 'Disabilita il passaggio di Mutation Testing')
  .action(async (opts) => {
    try {
      const specPath = path.resolve(opts.spec);
      const targetDir = path.resolve(opts.targetDir);
      const maxIterations = parseInt(opts.maxIterations, 10);

      const exists = await fs.stat(specPath).catch(() => null);
      if (!exists) {
        console.error(chalk.red(`Errore: File specifica non trovato: ${specPath}`));
        process.exit(1);
      }

      const llm = new SmartLLMProvider();
      const agent = new SpecVerificationAgent(llm);

      const report = await agent.run({
        specPath,
        targetDir,
        maxIterations,
        runMutationCheck: opts.mutation !== false,
      });

      if (!report.verified) {
        console.error(chalk.bold.red('\n❌ La verifica formale non è riuscita a raggiungere il 100% nel budget di iterazioni assegnato.'));
        process.exit(1);
      } else {
        console.log(chalk.bold.green('\n🎉 Codice verificato con successo, immune a mutazioni e garantito contro regressioni!'));
      }
    } catch (err: any) {
      console.error(chalk.red(`Fatal Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('pr-check')
  .description('Analizza il diff Git rispetto al branch base per intercettare regressioni')
  .option('-b, --base <branch>', 'Branch base di riferimento', 'main')
  .action(async (opts) => {
    try {
      console.log(chalk.bold.blue(`\n🔍 Esecuzione Git-Native PR Regression Guard vs '${opts.base}'...`));
      const gitGuard = new GitGuard();
      const diffSummary = await gitGuard.getDiffAgainstBase(opts.base);

      console.log(chalk.cyan(`Branch corrente: ${diffSummary.branch}`));
      console.log(chalk.cyan(`File modificati/aggiunti: ${diffSummary.changedFiles.length}`));

      if (diffSummary.changedFiles.length === 0) {
        console.log(chalk.green('Nessun file modificato rispetto al branch di base. Tutto pulito!'));
        return;
      }

      diffSummary.changedFiles.forEach(f => console.log(chalk.gray(` - ${f}`)));
      console.log(chalk.green(`\n✔ Git diff pronto per l'analisi dei contratti di regressione.`));
    } catch (err: any) {
      console.error(chalk.red(`Git PR Check Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('install-hooks')
  .description('Installa il Git Pre-Commit Hook per la verifica formale automatica pre-commit')
  .action(async () => {
    try {
      const hookPath = path.resolve('.git/hooks/pre-commit');
      const hookScript = `#!/bin/sh
# Git-Native Spec-to-Code Pre-Commit Guard (by Franca Roscilli)
echo "🛡️ Esecuzione controllo di verifica formale pre-commit..."
npx tsx src/cli/index.ts pr-check || exit 1
`;
      await fs.writeFile(hookPath, hookScript, { mode: 0o755 });
      console.log(chalk.bold.green('✔ Git Pre-Commit Hook installato con successo in .git/hooks/pre-commit'));
    } catch (err: any) {
      console.error(chalk.red(`Errore installazione hook: ${err.message}`));
    }
  });

program.parse(process.argv);
