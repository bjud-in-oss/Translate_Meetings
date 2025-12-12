// Type definitions for environment variables

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Fix for "Cannot redeclare block-scoped variable 'process'" error.
// The error implies 'process' is already declared (likely via @types/node).
// We extend the NodeJS.ProcessEnv interface to include API_KEY.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}
