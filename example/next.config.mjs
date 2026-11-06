// This site is embedded in codevideo-cli and served by its Go file server, so
// it has to stay a plain folder of files. trailingSlash makes /v3 a directory
// holding index.html, which is what that server needs for /v3?uuid=...
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: false,
  // Next names a folder after the build id. A fixed one keeps the copy committed
  // in the CLI from changing on every build when nothing else did.
  generateBuildId: () => "site",
  // Only the demo deployed to GitHub Pages lives under a subpath.
  ...(process.env.GITHUB_PAGES === "true" ? { basePath: "/codevideo-ide-react" } : {}),
  // Builds have never type-checked these pages, and a few demo pages still fail
  // `npm run type-check`.
  typescript: { ignoreBuildErrors: true },
  // This folder has its own lockfile inside the library's repo. Stay inside it.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
