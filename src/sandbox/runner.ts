import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const execAsync = promisify(exec);

export interface SandboxRunOptions {
  workDir: string;
  testFilePath: string;
  targetFilePath: string;
  timeoutMs?: number;
}

export interface SandboxRunResult {
  passed: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  counterexample?: string;
  failureMessage?: string;
}

export class LocalSandboxRunner {
  /**
   * Esegue i test con vitest/tsx in un processo isolato con timeout e cattura dell'output.
   */
  async runTest(options: SandboxRunOptions): Promise<SandboxRunResult> {
    const timeout = options.timeoutMs || 20000;
    const testFile = path.resolve(options.testFilePath);

    // Eseguiamo il file di test tramite npx vitest run --reporter=verbose
    const cmd = `npx vitest run "${testFile}" --reporter=verbose --no-color`;

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: options.workDir,
        timeout,
        env: {
          ...process.env,
          NODE_ENV: 'test',
          CI: 'true',
        },
      });

      return {
        passed: true,
        exitCode: 0,
        stdout,
        stderr,
      };
    } catch (err: any) {
      const stdout = err.stdout || '';
      const stderr = err.stderr || err.message || '';
      const parsedError = this.parseFastCheckError(stdout + '\n' + stderr);

      return {
        passed: false,
        exitCode: err.code || 1,
        stdout,
        stderr,
        counterexample: parsedError.counterexample,
        failureMessage: parsedError.failureMessage,
      };
    }
  }

  /**
   * Estrae controesempi e dettagli di violazione proprietà generati da fast-check / vitest
   */
  private parseFastCheckError(rawOutput: string): { counterexample?: string; failureMessage?: string } {
    let counterexample: string | undefined;
    let failureMessage: string | undefined;

    // Pattern tipico di fast-check:
    // Property failed after X tests
    // Counterexample: [...]
    // Shrunk X times
    const counterMatch = rawOutput.match(/Counterexample:\s*(\[[\s\S]*?\]|\([^\)]*\)|[^\n\r]+)/i);
    if (counterMatch) {
      counterexample = counterMatch[1].trim();
    }

    // Estrazione errore o asserzione fallita
    const failMatch = rawOutput.match(/(AssertionError[\s\S]*?)(?=\n\s*at|\n\s*❯)/i) ||
                      rawOutput.match(/Property failed[\s\S]*?(?=\n\s*at|\n\s*❯)/i);
    if (failMatch) {
      failureMessage = failMatch[1].trim();
    } else {
      // Fallback: ultime 10 righe significative
      const lines = rawOutput.split('\n').filter(l => l.trim().length > 0);
      failureMessage = lines.slice(-10).join('\n');
    }

    return { counterexample, failureMessage };
  }
}
