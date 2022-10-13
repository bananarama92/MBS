interface HSVColor {
    H: number,
    S: number,
    V: number,
}

type ChatRoomSpaceType = "X" | "" | "M" | "Asylum";

type NotificationSetting = {
    AlertType: NotificationAlertType,
    Audio: NotificationAudioType,
};

type GenderSetting = {
    Female: boolean,
    Male: boolean,
};

declare class TextCache {
    constructor(path: string, warn?: string);
    path: string;
    warn: string;
    language: string;
    cache: Record<string, string>;
    rebuildListeners: (() => void)[];
    loaded: boolean;
    get(key: string): string;
    onRebuild(callback: () => void, immediate?: boolean): () => void;
    buildCache(): void;
    fetchCsv(): Promise<string[][]>;
    cacheLines(lines: string[][]): void;
    translate(lines: string[][]): Promise<string[][]>;
    buildTranslations(lines: string[][], translations: string[]): string[][];
}
