import type { AppProps } from "next/app";
import { loader } from "@monaco-editor/react";
import "firacode/distr/fira_code.css";
import "../styles/global.css";
import "@radix-ui/themes/styles.css";

// Monaco and Fira Code come from this site, not a CDN: the CLI renders this
// page in a headless browser that may have no network (desktop renders).
// scripts/copy-monaco.mjs puts Monaco's files in public/monaco/vs.
loader.config({ paths: { vs: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/monaco/vs` } });

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
