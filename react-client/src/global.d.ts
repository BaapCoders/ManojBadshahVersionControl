// Allow importing the SDK from the virtual module name we defined in Webpack
declare module "add-on-ui-sdk" {
    export const ready: Promise<void>;
    export const instance: {
        runtime: {
            dialog: any;
            apiProxy: (name: string) => Promise<any>;
        };
        clientStorage: any;
    };
    // Added 'app' definition to fix the error
    export const app: {
        document: {
            addImage: (blob: Blob) => Promise<void>;
            [key: string]: any;
        };
        [key: string]: any;
    };
    export default { ready, instance, app };
}

// Environment configuration injected by webpack
declare const __ENV__: {
    API_URL: string;
    PYTHON_SERVER_URL: string;
    VERSION: string;
    DEBUG: boolean;
};

// Global window fallback
declare global {
  interface Window {
    addOnUISdk: any;
  }
}