import type { AppProps } from "next/app";
import "../styles/global.css";
import "@radix-ui/themes/styles.css";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
