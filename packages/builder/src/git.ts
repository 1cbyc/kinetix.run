import simpleGit, { type SimpleGit } from "simple-git";
import { promises as fs } from "fs";
import path from "path";
import type { GitSource } from "./types";

/**
 * Clone a Git repository to a specified directory
 */
export async function cloneRepository(
  source: GitSource,
  targetDir: string
): Promise<void> {
  const git: SimpleGit = simpleGit();

  await fs.mkdir(targetDir, { recursive: true });

  await git.clone(source.url, targetDir, [
    "--branch",
    source.branch,
    "--single-branch",
    "--depth",
    "1",
  ]);

  const repoGit = simpleGit(targetDir);
  await repoGit.checkout(source.commitSha);
}

/**
 * Validate that a commit SHA exists in the repository
 */
export async function validateCommit(
  workDir: string,
  commitSha: string
): Promise<boolean> {
  try {
    const git = simpleGit(workDir);
    await git.revparse(["--verify", `${commitSha}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get commit information
 */
export async function getCommitInfo(
  workDir: string,
  commitSha: string
): Promise<{
  sha: string;
  author: string;
  message: string;
  date: Date;
}> {
  const git = simpleGit(workDir);
  const log = await git.log([commitSha, "-1"]);
  const commit = log.latest;

  if (!commit) {
    throw new Error(`Commit ${commitSha} not found`);
  }

  return {
    sha: commit.hash,
    author: commit.author_name,
    message: commit.message,
    date: new Date(commit.date),
  };
}

/**
 * List all files in the repository (excluding .git)
 */
export async function listRepositoryFiles(
  workDir: string
): Promise<string[]> {
  const files: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === ".git") continue;

      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(workDir, fullPath);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        files.push(relativePath);
      }
    }
  }

  await walk(workDir);
  return files;
}

/**
 * Clean up a cloned repository
 */
export async function cleanupRepository(workDir: string): Promise<void> {
  try {
    await fs.rm(workDir, { recursive: true, force: true });
  } catch (error) {
    console.error(`Failed to cleanup ${workDir}:`, error);
  }
}
