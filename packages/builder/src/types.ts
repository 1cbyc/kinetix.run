import type { RuntimeType } from "@kinetix/shared";

/**
 * Git repository source information
 */
export interface GitSource {
  url: string;
  branch: string;
  commitSha: string;
  installationId?: string;
}

/**
 * Build context passed to builders
 */
export interface BuildContext {
  projectId: string;
  deploymentId: string;
  runtime: RuntimeType;
  source: GitSource;
  workDir: string;
  envVars: Record<string, string>;
  buildCommand?: string;
  outputDirectory?: string;
}

/**
 * Build result from a successful build
 */
export interface BuildResult {
  success: true;
  artifactPath: string;
  buildDuration: number;
  outputSize: number;
  logs: string[];
  functions: FunctionInfo[];
}

/**
 * Build failure result
 */
export interface BuildFailure {
  success: false;
  error: string;
  logs: string[];
  buildDuration: number;
}

/**
 * Function information extracted during build
 */
export interface FunctionInfo {
  name: string;
  handler: string;
  path: string;
  runtime: RuntimeType;
  memory?: number;
  timeout?: number;
}

/**
 * Runtime detection result
 */
export interface RuntimeDetection {
  runtime: RuntimeType;
  confidence: number;
  version?: string;
  files: string[];
}

/**
 * Build step execution info
 */
export interface BuildStep {
  name: string;
  command: string;
  startTime: Date;
  endTime?: Date;
  exitCode?: number;
  stdout: string[];
  stderr: string[];
}

/**
 * Abstract builder interface
 */
export interface Builder {
  runtime: RuntimeType;
  detect(workDir: string): Promise<boolean>;
  build(context: BuildContext): Promise<BuildResult | BuildFailure>;
}
