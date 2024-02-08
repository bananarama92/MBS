import { clamp, sumBy } from "lodash-es";

/**
 * The maximum allowed single-packet byte-size before the BC server says no.
 * @see {@link https://github.com/Ben987/Bondage-Club-Server/blob/a23c73bcd85eddc4cbf41bff43dd31823c15fab7/app.js#L34}
 */
const MAX_DATA = 180_000;

/** Return an upper bound of the passed object's byte-size. */
function measureDataSize(data: unknown): Record<string, number> {
    const addonSize: Record<string, number> = {};
    const dataRecord = CommonIsObject(data) ? data : {};
    for (const [key, value] of Object.entries(dataRecord)) {
        try {
            const stringData = JSON.stringify(value ?? "");
            addonSize[key] = (new TextEncoder()).encode(stringData).byteLength;
        } catch {
            addonSize[key] = NaN;
        }
    }
    return addonSize;
}

export function getStorageElement(character: Character, coords: RectTuple): UIElement {
    const nBytesRecord = measureDataSize(character.OnlineSharedSettings);
    const nBytes = sumBy(Object.values(nBytesRecord), (i) => Number.isNaN(i) ? 0 : i);
    const heightFrac = clamp(nBytes / MAX_DATA, 0, 1);

    const nColorHalfID = 192;
    const nColorHalf = nColorHalfID.toString(16);
    const topColorID = clamp((2 * heightFrac - 1) / 0.9, 0, 1) * 2 * nColorHalfID;
    const topColor = (topColorID % nColorHalfID).toString(16);
    const topColor2 = heightFrac >= 0.5 ? `#${nColorHalf}${topColor}00` : `#${topColor}${nColorHalf}00`;
    return {
        coords: [...coords],
        run: (x, y, w, h) => {
            MainCanvas.beginPath();
            MainCanvas.rect(x - 3, y - 3, w + 6, h + 6);
            MainCanvas.lineWidth = 3;
            MainCanvas.strokeStyle = "Black";
            if (heightFrac >= 0.9) {
                MainCanvas.shadowBlur = 10;
                MainCanvas.shadowColor = "Red";
            }
            MainCanvas.stroke();
            DrawRect(x, y, w, h, "White");

            const offset = h * heightFrac;
            const grd2 = MainCanvas.createLinearGradient(0, h - offset, 0, 0);
            grd2.addColorStop(0, `#00${nColorHalfID}00`);
            grd2.addColorStop(clamp(0.5 / heightFrac, 0, 1), `#00${nColorHalfID}00`);
            grd2.addColorStop(1, topColor2);
            MainCanvas.fillStyle = grd2;
            MainCanvas.fillRect(x, y + offset, w, h - offset);

            if (MouseIn(x, y, w, h)) {
                DrawButtonHover(x, y, w, h, "Lorem Ipsum");
            }
        },
    };
}
