import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import * as path from 'node:path';
import { SandboxRunOptions, SandboxRunResult } from '../sandbox/runner.js';

const execAsync = promisify(exec);

export class PythonSandboxRunner {
  async runTest(options: SandboxRunOptions): Promise<SandboxRunResult> {
    const timeout = options.timeoutMs || 20000;
    const testFile = path.resolve(options.testFilePath);

    // Esegue pytest con supporto Hypothesis PBT
    const cmd = `python3 -m pytest "${testFile}" -v`;

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: options.workDir,
        timeout,
        env: {
          ...process.env,
          PYTHONPATH: options.workDir,
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
      const parsed = this.parseHypothesisError(stdout + '\n' + stderr);

      return {
        passed: false,
        exitCode: err.code || 1,
        stdout,
        stderr,
        counterexample: parsed.counterexample,
        failureMessage: parsed.failureMessage,
      };
    }
  }

  private parseHypothesisError(rawOutput: string): { counterexample?: string; failureMessage?: string } {
    let counterexample: string | undefined;
    let failureMessage: string | undefined;

    // Pattern tipico di Hypothesis:
    // Falsifying example: test_something(...)
    const match = rawOutput.match(/Falsifying example:\s*([^\n\r]+)/i);
    if (match) {
      counterexample = match[1].trim();
    }

    const failMatch = rawOutput.match(/E\s+AssertionError:?[^\n\r]*/i);
    if (failMatch) {
      failureMessage = failMatch[0].trim();
    } else {
      const lines = rawOutput.split('\n').filter(l => l.trim().length > 0);
      failureMessage = lines.slice(-8).join('\n');
    }

    return { counterexample, failureMessage };
  }
}
