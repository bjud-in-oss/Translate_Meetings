
interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Augment NodeJS namespace to include API_KEY in ProcessEnv.
// This resolves "Cannot redeclare block-scoped variable 'process'" by augmenting existing types.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}
