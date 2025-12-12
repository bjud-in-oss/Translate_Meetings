/// <reference types="vite/client" />

// TypeScript needs to know that 'process' exists globally because we use it in the code.
// Vite will replace 'process.env.API_KEY' with the actual string during build.
declare global {
  var process: {
    env: {
      API_KEY: string;
      [key: string]: string | undefined;
    }
  };
}

export {};
