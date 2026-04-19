export declare function getSystemInfo(name: string, koishiVersion: string, pluginSize: number): Promise<{
    name: string;
    dashboard: {
        progress: number;
        title: string;
    }[];
    information: {
        key: string;
        value: string;
    }[];
    footer: string;
}>;
