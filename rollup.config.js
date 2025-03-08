import typescript from 'rollup-plugin-typescript2';
import dts from 'rollup-plugin-dts';

const external = [
  "@fullstackcraftllc/codevideo-types", 
  "react", 
  "react/jsx-runtime",
  "@radix-ui/themes", 
  "@react-symbols/icons",
  "@monaco-editor/react",
  "@fullstackcraftllc/codevideo-virtual-ide",
  "monaco-editor"
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