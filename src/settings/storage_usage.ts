import { clamp } from "lodash-es";

import { drawHeaderedTooltip } from "../common_bc";

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

/**
 * Construct a {@link UIElement} for displaying BC data usage.
 * @param this -
 * @param this.dataSize The maximum and actually used size of {@link Character.OnlineSharedSettings}
 * @param this.character The character in question
 * @param coords A 4-tuple with the elements X & Y coordinates, width and height
 * @returns The new UI element
 */
export function getStorageElement(
    this: { readonly dataSize: DataSize, readonly character: Character },
    coords: RectTuple,
): UIElement {
    const nColorHalfID = 216;
    const nColorHalf = nColorHalfID.toString(16).padStart(2, "0");

    return {
        coords: [...coords],
        run: (x, y, w, h) => {
            if (!this.character.IsPlayer()) {
                DrawRect(x, y, w, h, "Gray");
                DrawEmptyRect(x, y, w, h, "Black", 2);
                DrawText(`- / ${MAX_DATA / 1000} KB`, x + (w / 2), y + h + 58, "Black");
                if (MouseIn(x, y, w, h)) {
                    DrawHoverElements.push(() => {
                        drawHeaderedTooltip(x + w + 36, y - 64, 550, 64, ["OnlineSharedSettings Data Usage"]);
                    });
                }
                return;
            }

            const heightFrac = clamp(this.dataSize.value / MAX_DATA, 0, 1);
            const topColorID = Math.round(clamp((heightFrac - 0.2) / 0.6, 0, 1) * 2 * nColorHalfID);
            const topColor = (topColorID % nColorHalfID).toString(16).padStart(2, "0");
            const topColor2 = (topColorID >= nColorHalfID) ? `#${nColorHalf}${topColor}00` : `#${topColor}${nColorHalf}00`;

            if (heightFrac >= 0.9) {
                MainCanvas.save();
                MainCanvas.beginPath();
                MainCanvas.fillStyle = "Red";
                MainCanvas.shadowBlur = 6;
                MainCanvas.shadowColor = "Red";
                MainCanvas.fillRect(x - 3, y - 3, w + 6, h + 6);
                MainCanvas.fill();

                MainCanvas.restore();
            }
            DrawRect(x, y, w, h, "White");

            const nKBTotal = clamp(byteToKB(this.dataSize.value), 0, 9999);
            DrawText(`${nKBTotal} / ${MAX_DATA / 1000} KB`, x + (w / 2), y + h + 58, "Black");

            const grad = MainCanvas.createLinearGradient(0, y + h, 0, y);
            grad.addColorStop(0, `#00${nColorHalf}00`);
            grad.addColorStop(clamp(0.2 / heightFrac, 0, 1), `#00${nColorHalf}00`);
            grad.addColorStop(clamp(0.8 / heightFrac, 0, 1), topColor2);
            grad.addColorStop(1, topColor2);
            MainCanvas.fillStyle = grad;
            MainCanvas.fillRect(x, y + h * (1 - heightFrac), w, h * heightFrac);

            DrawEmptyRect(x, y, w, h, "Black", 2);
            MainCanvas.beginPath();
            MainCanvas.lineWidth = 2;
            MainCanvas.strokeStyle = "Black";
            MainCanvas.moveTo(x, y + h * (1 - heightFrac));
            MainCanvas.lineTo(x + w, y + h * (1 - heightFrac));
            MainCanvas.stroke();

            if (MouseIn(x, y, w, h)) {
                let entries = Object.entries(this.dataSize.valueRecord).map(([k, v]) => {
                    if (k.length > 28) {
                        k = `${k.slice(0, 25)}...`;
                    }
                    const nKB = Number.isNaN(v) ? "Unknown" : `${byteToKB(v)} KB`;
                    return [k, nKB] as const;
                });
                if (entries.length >= 11) {
                    entries = entries.slice(0, 10);
                    entries.push(["...", ""]);
                }

                DrawHoverElements.push(() => {
                    drawHeaderedTooltip(x + w + 36, y - 64, 550, 64, ["OnlineSharedSettings Data Usage", ...entries.map(i => i[0])]);
                    MainCanvas.save();
                    MainCanvas.font = '30px "Arial", sans-serif';
                    MainCanvas.textAlign = "right";
                    entries.forEach(([_, nKB], i) => DrawText(nKB, x + w + 574, y + 8 + 24 + i * 48, "black"));
                    MainCanvas.restore();
                });
            }
        },
    };
}