import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The AI grounding (reference/grounding.md) and the connector catalog
  // (reference/connectors.json) are read at runtime via fs from
  // process.cwd() — see src/lib/ai/grounding.ts and src/lib/connectors.ts.
  // Trace them into the serverless bundles so deploys (e.g. Vercel) can read
  // them. No effect on local dev.
  outputFileTracingIncludes: {
    "/**": ["./reference/grounding.md", "./reference/connectors.json"],
  },
};

export default nextConfig;
