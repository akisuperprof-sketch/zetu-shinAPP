/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_DEV_FEATURES_MASTER: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
