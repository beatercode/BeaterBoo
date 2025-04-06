declare module 'pg';
declare module '@fingerprintjs/fingerprintjs';

interface ImportMeta {
  readonly env: {
    readonly VITE_GEMINI_API_KEY?: string;
    readonly VITE_GEMINI_MODEL?: string;
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_DATABASE_URL?: string;
    readonly DEV: boolean;
    readonly [key: string]: string | boolean | undefined;
  };
}
