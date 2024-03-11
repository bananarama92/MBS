/**
 * The maximum allowed single-packet byte-size before the BC server says no.
 * @see {@link https://github.com/Ben987/Bondage-Club-Server/blob/a23c73bcd85eddc4cbf41bff43dd31823c15fab7/app.js#L34}
 */
export const MAX_DATA = 180_000;

/**
 * Return an upper bound of the passed object's byte-size.
 * @param data The object whose size is to-be measured on a key-by-key basis
 * @returns A record mapping all keys in `data` to their respective byte size or `NaN` if it cannot be determined
 */
export function measureDataSize(data: unknown): Record<string, number> {
    const addonSize: [name: string, nByte: number][] = [];
    const dataRecord = CommonIsObject(data) ? data : {};
    for (const [key, value] of Object.entries(dataRecord)) {
        try {
            const stringData = JSON.stringify(value ?? "");
            addonSize.push([key, (new TextEncoder()).encode(stringData).byteLength]);
        } catch {
            addonSize.push([key, NaN]);
        }
    }

    return Object.fromEntries(addonSize.sort(([k1, nByte1], [k2, nByte2]) => {
        nByte1 = Math.round(nByte1 / 100);
        nByte2 = Math.round(nByte2 / 100);
        const isNan1 = Number.isNaN(nByte1);
        const isNan2 = Number.isNaN(nByte2);
        if (nByte1 === nByte2 || (isNan1 && isNan2)) {
            return k1.localeCompare(k2);
        } else if (isNan1 || isNan2) {
            return isNan2 ? -1 : 1;
        } else {
            return nByte2 - nByte1;
        }
    }));
}

/**
 * Convert B to KB with up to one decimal digit.
 * @param nByte The value in byte
 * @returns The passed value converted to kilo byte
 */
export function byteToKB(nByte: number) {
    return Math.round(nByte / 100) / 10;
}
