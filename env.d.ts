// Type definitions for environment variables

// Define types for Vite's import.meta.env manually to avoid 'vite/client' reference issues
interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Augment the global NodeJS namespace to ensure ProcessEnv includes API_KEY.
// We do NOT declare 'var process' here to avoid "Cannot redeclare block-scoped variable" errors.
// This interface merging works automatically with @types/node.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}
