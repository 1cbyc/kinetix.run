import { promises as fs } from "fs";
import path from "path";
import { RuntimeType } from "@kinetix/shared";
import type { RuntimeDetection } from "./types";

/**
 * Detect the runtime of a project by examining its files
 */
export async function detectRuntime(
  workDir: string
): Promise<RuntimeDetection | null> {
  const detectors = [
    detectNodeJs,
    detectDeno,
    detectPython,
    detectGo,
    detectRust,
  ];

  for (const detector of detectors) {
    const result = await detector(workDir);
    if (result) {
      return result;
    }
  }

  return null;
}

/**
 * Check if a file exists in the work directory
 */
async function fileExists(workDir: string, fileName: string): Promise<boolean> {
  try {
    await fs.access(path.join(workDir, fileName));
    return true;
  } catch {
    return false;
  }
}

/**
 * Read and parse JSON file
 */
async function readJsonFile(
  workDir: string,
  fileName: string
): Promise<Record<string, unknown> | null> {
  try {
    const content = await fs.readFile(path.join(workDir, fileName), "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Detect Node.js projects
 */
async function detectNodeJs(
  workDir: string
): Promise<RuntimeDetection | null> {
  const hasPackageJson = await fileExists(workDir, "package.json");

  if (!hasPackageJson) {
    return null;
  }

  const packageJson = await readJsonFile(workDir, "package.json");
  const files = ["package.json"];

  if (await fileExists(workDir, "package-lock.json")) {
    files.push("package-lock.json");
  }
  if (await fileExists(workDir, "yarn.lock")) {
    files.push("yarn.lock");
  }
  if (await fileExists(workDir, "pnpm-lock.yaml")) {
    files.push("pnpm-lock.yaml");
  }

  const nodeVersion = packageJson?.engines
    ? (packageJson.engines as Record<string, string>).node
    : undefined;

  return {
    runtime: RuntimeType.enum.nodejs20,
    confidence: 1.0,
    version: nodeVersion,
    files,
  };
}

/**
 * Detect Deno projects
 */
async function detectDeno(workDir: string): Promise<RuntimeDetection | null> {
  const hasDenoJson = await fileExists(workDir, "deno.json");
  const hasDenoJsonc = await fileExists(workDir, "deno.jsonc");

  if (!hasDenoJson && !hasDenoJsonc) {
    return null;
  }

  const files = [];
  if (hasDenoJson) files.push("deno.json");
  if (hasDenoJsonc) files.push("deno.jsonc");

  return {
    runtime: RuntimeType.enum.deno,
    confidence: 1.0,
    files,
  };
}

/**
 * Detect Python projects
 */
async function detectPython(
  workDir: string
): Promise<RuntimeDetection | null> {
  const hasRequirements = await fileExists(workDir, "requirements.txt");
  const hasPipfile = await fileExists(workDir, "Pipfile");
  const hasPoetry = await fileExists(workDir, "pyproject.toml");

  if (!hasRequirements && !hasPipfile && !hasPoetry) {
    return null;
  }

  const files = [];
  if (hasRequirements) files.push("requirements.txt");
  if (hasPipfile) files.push("Pipfile");
  if (hasPoetry) files.push("pyproject.toml");

  let version: string | undefined;
  if (hasPoetry) {
    try {
      const content = await fs.readFile(
        path.join(workDir, "pyproject.toml"),
        "utf-8"
      );
      const match = content.match(/python\s*=\s*"([^"]+)"/);
      if (match) {
        version = match[1];
      }
    } catch {
      // Ignore parsing errors
    }
  }

  return {
    runtime: RuntimeType.enum.python312,
    confidence: 1.0,
    version,
    files,
  };
}

/**
 * Detect Go projects
 */
async function detectGo(workDir: string): Promise<RuntimeDetection | null> {
  const hasGoMod = await fileExists(workDir, "go.mod");

  if (!hasGoMod) {
    return null;
  }

  let version: string | undefined;
  try {
    const content = await fs.readFile(path.join(workDir, "go.mod"), "utf-8");
    const match = content.match(/^go\s+(\d+\.\d+)/m);
    if (match) {
      version = match[1];
    }
  } catch {
    // Ignore parsing errors
  }

  return {
    runtime: RuntimeType.enum.go121,
    confidence: 1.0,
    version,
    files: ["go.mod"],
  };
}

/**
 * Detect Rust projects
 */
async function detectRust(workDir: string): Promise<RuntimeDetection | null> {
  const hasCargoToml = await fileExists(workDir, "Cargo.toml");

  if (!hasCargoToml) {
    return null;
  }

  return {
    runtime: RuntimeType.enum.rust,
    confidence: 1.0,
    files: ["Cargo.toml"],
  };
}
