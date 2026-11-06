import { simpleGit, SimpleGit } from 'simple-git';

export interface GitDiffSummary {
  branch: string;
  baseBranch: string;
  changedFiles: string[];
  diff: string;
}

export class GitGuard {
  private git: SimpleGit;

  constructor(baseDir?: string) {
    this.git = simpleGit(baseDir || process.cwd());
  }

  async isGitRepo(): Promise<boolean> {
    try {
      return await this.git.checkIsRepo();
    } catch {
      return false;
    }
  }

  async getDiffAgainstBase(baseBranch = 'main'): Promise<GitDiffSummary> {
    const isRepo = await this.isGitRepo();
    if (!isRepo) {
      throw new Error('La directory corrente non è un repository git valido.');
    }

    const currentBranch = (await this.git.branch()).current;
    let diff = '';
    try {
      diff = await this.git.diff([`${baseBranch}...HEAD`]);
    } catch {
      // Se non esiste baseBranch remoto o locale, fallback a diff HEAD~1
      diff = await this.git.diff(['HEAD~1']);
    }

    const status = await this.git.status();
    const changedFiles = [
      ...status.modified,
      ...status.created,
      ...status.not_added,
    ];

    return {
      branch: currentBranch,
      baseBranch,
      changedFiles,
      diff,
    };
  }
}
