import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import dts from 'rollup-plugin-dts';
import {visualizer} from 'rollup-plugin-visualizer';

const external = [
  "@fullstackcraftllc/codevideo-types", 
  "react", 
  "react-dom/client",
  "react/jsx-runtime",
  "@radix-ui/themes",
  "@radix-ui/react-icons", 
  "@react-symbols/icons",
  "@monaco-editor/react",
  "@fullstackcraftllc/codevideo-virtual-ide",
  "monaco-editor",
  "marked",
  "marked-highlight",
  "highlight.js",
  "dompurify",
];

export default  [
  // standard package
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "es",
    },
    plugins: [typescript()],
    external
  },
  // Embeddable bundle (UMD format, all-inclusive bundle, all external dependencies are bundled in)
  {
    input: "src/EmbeddableCodeVideoIDE.tsx",
    output: {
      file: "dist/embeddable.bundle.js",
      format: "umd",
      name: "CodeVideoIDEEmbeddable", // Global variable name
    },
    plugins: [
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
        preventAssignment: true,
      }),
      resolve(),   // Resolve node_modules dependencies
      commonjs(),  // Convert CommonJS modules to ES modules
      typescript(),
      visualizer()
    ],
    // Do not set 'external' here so that all dependencies are bundled in.
  },
  // type declarations
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.d.ts", 
        format: "es",
      },
    ],
    plugins: [
      dts(),
    ],
    external
  },
];