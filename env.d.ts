// Removed vite/client reference to fix error
// /// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Ensure process is defined for libraries that expect it (like @google/genai guidelines suggest usage)
declare var process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
};
