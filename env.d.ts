// Type definitions for environment variables

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Fix for "Cannot find name 'process'" error.
// We manually declare the global process variable so TypeScript accepts it during the build
// without needing to install heavy Node.js types.
declare var process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
};