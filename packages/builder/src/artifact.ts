import { promises as fs } from "fs";
import path from "path";
import * as tar from "tar";
import { tmpdir } from "os";

/**
 * Create a tarball artifact from a build output directory
 */
export async function createArtifact(
  deploymentId: string,
  sourceDir: string
): Promise<string> {
  const artifactDir = path.join(tmpdir(), "kinetix-artifacts");
  await fs.mkdir(artifactDir, { recursive: true });

  const artifactPath = path.join(artifactDir, `${deploymentId}.tar.gz`);

  await tar.create(
    {
      gzip: true,
      file: artifactPath,
      cwd: sourceDir,
    },
    await fs.readdir(sourceDir)
  );

  return artifactPath;
}

/**
 * Extract an artifact tarball to a destination directory
 */
export async function extractArtifact(
  artifactPath: string,
  destDir: string
): Promise<void> {
  await fs.mkdir(destDir, { recursive: true });

  await tar.extract({
    file: artifactPath,
    cwd: destDir,
  });
}

/**
 * Calculate the total size of a directory in bytes
 */
export async function calculateDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }
  }

  await walk(dirPath);
  return totalSize;
}

/**
 * Clean up old artifacts (older than retention period)
 */
export async function cleanupOldArtifacts(
  retentionDays: number = 7
): Promise<void> {
  const artifactDir = path.join(tmpdir(), "kinetix-artifacts");

  try {
    const entries = await fs.readdir(artifactDir, { withFileTypes: true });
    const now = Date.now();
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".tar.gz")) {
        const filePath = path.join(artifactDir, entry.name);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > retentionMs) {
          await fs.unlink(filePath);
        }
      }
    }
  } catch (error) {
    console.error("Failed to cleanup old artifacts:", error);
  }
}
