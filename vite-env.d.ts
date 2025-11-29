/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly hot?: {
    accept: (callback?: (modules: any) => void) => void;
    dispose: (callback: (data: any) => void) => void;
    data: any;
  };
}
