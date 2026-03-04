/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_DEV_FEATURES_MASTER: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare const __BUILD_INFO__: {
    version: string;
    sha: string;
    env: string;
};
