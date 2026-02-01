/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEMO_MODE: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_DEBUG_MODE: string;
  readonly VITE_DEFAULT_SPEECH_RATE: string;
  readonly VITE_DEFAULT_PITCH: string;
  readonly VITE_DEFAULT_VOLUME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
