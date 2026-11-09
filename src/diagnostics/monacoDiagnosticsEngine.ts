import type { Monaco } from '@monaco-editor/react';
import {
  ICodeVideoDiagnostic, IFileSource, ITypeScriptDiagnostic,
  createDiagnosticsShims, getDiagnosticsChecks, getDiagnosticsCompilerOptions, isDiagnosticsProgramFile, toCodeVideoDiagnostic, toDiagnosticsFileName,
} from '@fullstackcraftllc/codevideo-types';

/** Computes diagnostics for `targets` (project paths) given every project file. */
export interface DiagnosticsEngine {
  compute(files: Array<IFileSource>, targets: Array<string>): Promise<Array<ICodeVideoDiagnostic>>;
  /** Starts the worker early so the first squiggles don't wait for it to load. */
  warmUp(): void;
  dispose(): void;
}

interface TypeScriptWorkerProxy {
  updateExtraLibs(libs: Record<string, { content: string; version: number }>): Promise<void>;
  getSyntacticDiagnostics(fileName: string): Promise<Array<ITypeScriptDiagnostic>>;
  getSemanticDiagnostics(fileName: string): Promise<Array<ITypeScriptDiagnostic>>;
}

/**
 * Diagnostics from a TypeScript worker of our own, separate from the one that
 * powers Monaco's language features. Determinism comes from three choices:
 *  - only this engine talks to the worker, so no hover, completion or
 *    built-in validation request shares (and reorders) its type checker;
 *  - every computation sends all files with a new version, so the language
 *    service builds a fresh program and checker from the inputs alone, never
 *    from what an earlier computation in this browser happened to check;
 *  - files are checked one by one in a fixed order.
 * The result is then a pure function of the files, the same in a render that
 * started at frame 0 and in one resumed from a checkpoint. The worker runs
 * Monaco's bundled TypeScript (DIAGNOSTICS_TYPESCRIPT_VERSION), which
 * codevideo-mcp pins too.
 */
export function createMonacoDiagnosticsEngine(monaco: Monaco): DiagnosticsEngine {
  let worker: { getProxy(): Promise<TypeScriptWorkerProxy>; dispose(): void } | null = null;
  let version = 0;
  const proxy = () => {
    if (!worker) {
      worker = monaco.editor.createWebWorker<TypeScriptWorkerProxy & object>({
        moduleId: 'vs/language/typescript/tsWorker',
        label: 'typescript',
        keepIdleModels: true,
        createData: { compilerOptions: getDiagnosticsCompilerOptions(), extraLibs: {}, inlayHintsOptions: {} },
      }) as any;
    }
    return worker!.getProxy();
  };
  return {
    async compute(files, targets) {
      const shims = createDiagnosticsShims(files);
      const program = [...files.filter(file => isDiagnosticsProgramFile(file.path)), shims];
      version++;
      const libs = Object.fromEntries(program.map(file => [toDiagnosticsFileName(file.path), { content: file.content, version }]));
      const typescript = await proxy();
      await typescript.updateExtraLibs(libs);
      const contents = new Map(files.map(file => [file.path, file.content]));
      const diagnostics: Array<ICodeVideoDiagnostic> = [];
      for (const path of targets) {
        const checks = getDiagnosticsChecks(path), content = contents.get(path);
        if (!checks || content === undefined) continue;
        const fileName = toDiagnosticsFileName(path);
        const raw = [
          ...(checks.syntactic ? await typescript.getSyntacticDiagnostics(fileName) : []),
          ...(checks.semantic ? await typescript.getSemanticDiagnostics(fileName) : []),
        ];
        diagnostics.push(...raw.map(diagnostic => toCodeVideoDiagnostic(path, content, diagnostic)));
      }
      return diagnostics;
    },
    warmUp() { void proxy().catch(() => {}); },
    dispose() { worker?.dispose(); worker = null; },
  };
}
