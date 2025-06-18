import React, { useEffect, useRef, useState } from "react";
import * as esbuild from "esbuild-wasm";
import { IFileEntry } from "@fullstackcraftllc/codevideo-types";

export interface WebPreviewProps {
  /** Files that make up the virtual project */
  files: IFileEntry[];
  /** Height of the preview (use CSS units). Defaults to 100vh. */
  height?: string | number;
}

// --- ESBUILD INITIALIZATION
const WASM_URLS = [
  "https://unpkg.com/esbuild-wasm@0.25.5/esbuild.wasm",
  "https://cdn.jsdelivr.net/npm/esbuild-wasm@0.25.5/esbuild.wasm"
];
const REACT_CDN = "https://esm.sh/react@18?bundle";
const REACT_DOM_CDN = "https://esm.sh/react-dom@18?bundle";

let esbuildInitialized = false;
let esbuildInitializing = false;
let esbuildInitPromise: Promise<void> | null = null;

const initializeEsbuild = async (): Promise<void> => {
  if (esbuildInitialized) return;
  if (esbuildInitializing && esbuildInitPromise) return esbuildInitPromise;
  
  esbuildInitializing = true;
  esbuildInitPromise = (async () => {
    let lastError: Error | null = null;
    for (const wasmURL of WASM_URLS) {
      try {
        await esbuild.initialize({ wasmURL, worker: false });
        console.log(`Successfully initialized esbuild with ${wasmURL}`);
        esbuildInitialized = true;
        esbuildInitializing = false;
        return;
      } catch (error) {
        console.warn(`Failed to initialize esbuild with ${wasmURL}:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }
    esbuildInitializing = false;
    throw lastError || new Error('Failed to initialize esbuild with any WASM URL');
  })();
  return esbuildInitPromise;
};

// --- VIRTUAL FILE PLUGIN ---
const createVirtualPlugin = (vfs: Map<string, string>): esbuild.Plugin => ({
  name: "virtual-fs",
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      if (args.path === "react" || args.path === "react-dom") {
        return { path: args.path, external: true };
      }
      const path = args.path.startsWith("/") ? args.path : `/${args.path.replace(/^\.\//, "")}`;
      if (vfs.has(path)) {
        return { path, namespace: "vfs" };
      }
      return undefined;
    });

    build.onLoad({ filter: /.*/, namespace: "vfs" }, async (args) => {
      const contents = vfs.get(args.path) ?? "";
      const ext = args.path.split(".").pop() ?? "js";
      const loader = ((): esbuild.Loader => {
        if (ext === "ts") return "ts";
        if (ext === "tsx") return "tsx";
        if (ext === "jsx") return "jsx";
        return "js";
      })();
      return { contents, loader };
    });
  },
});

// +++ NEW: Added an enum for clarity +++
enum ProjectType {
  HTML = "html",
  JSX = "jsx",
  TSX = "tsx",
}

export const WebPreview: React.FC<WebPreviewProps> = ({
  files,
  height = "100vh",
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [esbuildReady, setEsbuildReady] = useState(esbuildInitialized);
  const [esbuildError, setEsbuildError] = useState<string | null>(null);

  // --- ESBUILD INITIALIZATION EFFECT ---
  useEffect(() => {
    if (esbuildInitialized) {
      setEsbuildReady(true);
      return;
    }
    let isMounted = true;
    (async () => {
      try {
        await initializeEsbuild();
        if (isMounted) setEsbuildReady(true);
      } catch (error) {
        console.error('Failed to initialize esbuild:', JSON.stringify(error));
        if (isMounted) setEsbuildError(error instanceof Error ? error.message : 'Unknown error');
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // --- BUNDLING EFFECT ---
  useEffect(() => {
    // Don't run if files are empty or esbuild isn't ready for JSX/TSX
    if (files.length === 0) return;

    (async () => {
      try {
        // Build a virtual file system map. Path must start with "/"
        const vfs = new Map<string, string>();
        for (const f of files) {
          const path = f.path.startsWith("/") ? f.path : `/${f.path}`;
          vfs.set(path, f.content);
        }

        const entryHtmlFile = files.find((f) => f.path.endsWith(".html"));
        let html = entryHtmlFile?.content || `<!DOCTYPE html><html><head></head><body></body></html>`;

        // +++ NEW: Determine project type for clearer logic paths +++
        let projectType = ProjectType.HTML;
        if (files.some((f) => f.path.endsWith(".tsx"))) projectType = ProjectType.TSX;
        else if (files.some((f) => f.path.endsWith(".jsx"))) projectType = ProjectType.JSX;

        // +++ NEW: Wait for esbuild only if needed +++
        if (projectType !== ProjectType.HTML && !esbuildReady) {
          return; // Wait for the next render when esbuild is ready
        }
        
        // +++ NEW: Switch based on project type for clean separation +++
        switch (projectType) {
          // --- CASE 1: Pure HTML/CSS/JS Project ---
          case ProjectType.HTML: {
            // Replace <link> tags with <style> tags
            html = html.replace(/<link[^>]+href="([^"]+\.css)"[^>]*>/g, (match, cssPath) => {
                const cssContent = vfs.get(`/${cssPath.replace(/^\.\//, "")}`);
                return cssContent ? `<style>\n${cssContent}\n</style>` : match;
            });

            // Replace <script> tags with their inlined content
            html = html.replace(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g, (match, scriptPath) => {
                const jsContent = vfs.get(`/${scriptPath.replace(/^\.\//, "")}`);
                return jsContent ? `<script>\n${jsContent}\n</script>` : match;
            });
            break;
          }

          // --- CASE 2 & 3: JSX or TSX Project (needs bundling) ---
          case ProjectType.JSX:
          case ProjectType.TSX: {
            const scriptEntry = files.find((f) => /\.(t|j)sx$/.test(f.path))?.path ?? "index.tsx";

            const result = await esbuild.build({
              bundle: true,
              write: false,
              format: "iife",
              platform: "browser",
              entryPoints: [`/${scriptEntry}`],
              plugins: [createVirtualPlugin(vfs)],
              external: ["react", "react-dom"],
              target: ["es2020"],
              define: { 'process.env.NODE_ENV': '"development"' }
            });
            const bundledCode = result.outputFiles[0].text;

            // +++ FIX: Remove all script tags from the body before injecting the bundle +++
            html = html.replace(/<body[^>]*>[\s\S]*<\/body>/i, (bodyTag) => {
                const cleanedBody = bodyTag.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
                return cleanedBody.replace(/<\/body>/i, `<script>${bundledCode}</script></body>`);
            });

            // +++ FIX: Replace CSS links with style tags to prevent 404s +++
            html = html.replace(/<link[^>]+href="([^"]+\.css)"[^>]*>/g, (match, cssPath) => {
                const cssContent = vfs.get(`/${cssPath.replace(/^\.\//, "")}`);
                return cssContent ? `<style>\n${cssContent}\n</style>` : match;
            });
            
            // Inject React CDN if it's used
            html = html.replace(/<\/head>/i, `<script src="${REACT_CDN}"></script><script src="${REACT_DOM_CDN}"></script></head>`);
            
            break;
          }
        }

        // Write the final composed HTML to the iframe
        if (iframeRef.current) {
          iframeRef.current.srcdoc = html;
        }
      } catch (error) {
        console.error('Bundle error:', JSON.stringify(error));
        if (iframeRef.current) {
          iframeRef.current.srcdoc = `<body style="font-family: monospace; color: #e74c3c;"><h3>Bundle Error:</h3><pre>${error instanceof Error ? error.message : 'Unknown error'}</pre></body>`;
        }
      }
    })();
  }, [files, esbuildReady]); // Depend on esbuildReady

  // --- LOADING AND ERROR STATES ---
  if (esbuildError) {
    return (
      <div style={{ padding: "20px", color: "#e74c3c", fontFamily: "monospace" }}>
        <h3>WebPreview Error:</h3>
        <pre>{esbuildError}</pre>
      </div>
    );
  }

  // Show a clearer loading state
  if (!esbuildReady && files.some(f => /\.(t|j)sx$/.test(f.path))) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: height, fontFamily: "sans-serif" }}>
        Initializing Preview Environment...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: height }} data-testid="web-preview">
      <iframe
        ref={iframeRef}
        style={{ width: "100%", height: "100%", border: "0" }}
        sandbox="allow-scripts allow-same-origin"
        title="Web Preview"
      />
    </div>
  );
};