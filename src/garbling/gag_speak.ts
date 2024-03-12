import { range } from "lodash-es";

import _phoneticDict from "./vendor/en_UK.json" assert { type: "json" };
import _gagData from "./vendor/gag_data.json" assert { type: "json" };

namespace GarbleOptions {
    export interface Base {
        dropChars?: null | number,
    }
    export interface Parsed extends Record<keyof Base, unknown> {
        dropChars: (word: string) => string,
    }
}

type GagData = Record<string, { MUFFLE: number, SOUND: string }>;

const GAG_DATA: Readonly<Record<keyof typeof _gagData, GagData>> = Object.freeze(_gagData);

export const GAG_LEVEL = Object.freeze({
    light: 4,
    medium: 8,
    heavy: 12,
    veryHeavy: 16,
});

const PHONETIC_DICT: Readonly<Record<string, undefined | string>> = Object.freeze(_phoneticDict);

const PHONEMES_SYMBOLS_EN_UK = Object.freeze(new Set([
    "b", "aʊ", "t", "k", "ə", "z", "ɔ", "ɹ", "s", "j", "u", "m", "f", "ɪ", "oʊ", "ʊ", "ɡ", "ɛ", "n",
    "eɪ", "d", "ɫ", "w", "i", "p", "ɑ", "ɝ", "θ", "v", "h", "æ", "ŋ", "ʃ", "ʒ", "aɪ", "dʒ", "tʃ", "ð",
    "ɔɪ", "ɪə",
]));

const LETTER_REGEX = /\p{L}/u;

/**
 * Convert a single English word to a list of its respective International Phonetic Alphabet (IPA) characters
 * @param word The to-be converted word
 * @returns The words IPA characters or `undefined` if the word is unknown
 */
function wordToIPA(word: string): undefined | string[] {
    const wordLower = word.toLowerCase();
    const wordPhonetic = PHONETIC_DICT[wordLower];
    if (wordPhonetic === undefined) {
        return undefined;
    }

    const phonetics: string[] = [];
    const wordPhoneticSan = wordPhonetic.split(",")[0].replace(/[/ˌˈː\s]/g, "");
    let i = 0;
    while (i < wordPhoneticSan.length) {
        const char1 = wordPhoneticSan[i];
        const char12 = wordPhoneticSan.slice(i, i + 2);
        if (PHONEMES_SYMBOLS_EN_UK.has(char12)) {
            phonetics.push(char12);
            i += 2;
        } else {
            phonetics.push(char1);
            i += 1;
        }
    }
    return phonetics;
}

/**
 * Drop up to 40% of all passed (trailing) characters in the passed string depending on the gag level
 * @param word
 * @param gagLevel
 * @returns
 */
function dropTrailingChars(word: string, gagLevel: number, minGagLevel: number): string {
    if (gagLevel < minGagLevel) {
        return word;
    }

    const wordArray = Array.from(word);
    const nChars = Math.floor(wordArray.length * (Math.min(8, gagLevel - GAG_LEVEL.heavy) / 20));
    return word.slice(0, wordArray.length - nChars).padEnd(wordArray.length - Math.floor(nChars / 2));
}

function parseOptions(options: null | GarbleOptions.Base, gagLevel: number): GarbleOptions.Parsed {
    let dropChars = (word: string) => word;
    if (options?.dropChars != null) {
        dropChars = (word) => dropTrailingChars(word, gagLevel, options.dropChars as number);
    }

    return { dropChars };
}

function getGagData(gagLevel: number): GagData {
    if (gagLevel < GAG_LEVEL.light) {
        return GAG_DATA["Cleave Gag"];
    } else if (gagLevel < GAG_LEVEL.medium) {
        return GAG_DATA["Ball Gag"];
    } else {
        return GAG_DATA["Plug Gag"];
    }
}

export function convertToGagSpeak(sentence: string, gagLevel: number, options: null | GarbleOptions.Base = null): string {
    const { dropChars } = parseOptions(options, gagLevel);
    const gagData = getGagData(gagLevel);

    const oocRanges = SpeechGetOOCRanges(sentence);
    const oocIndices = new Set(oocRanges.flatMap(({ start, length }) => range(start, start + length)));

    let garbledSentence = "";
    let word = "";
    let caps: boolean[] = [];
    let inOOC = false;
    const iMax = sentence.length - 1;
    for (const [i, char] of Array.from(sentence).entries()) {
        if (LETTER_REGEX.test(char) && i < iMax) {
            inOOC ||= oocIndices.has(i);
            word += char;
            caps.push(char.toUpperCase() === char);
        } else {
            if (!word) {
                garbledSentence += char;
                continue;
            }

            if (!inOOC) {
                let garbledWord: string;
                const phonetics = wordToIPA(word);
                if (phonetics) {
                    garbledWord = dropChars(phonetics.map(j => gagData[j]?.SOUND ?? "").join(""));
                } else {
                    garbledWord = SpeechGarbleByGagLevel(gagLevel, word);
                }

                if (caps.every(Boolean)) {
                    garbledSentence += garbledWord.toUpperCase();
                } else if (caps[0] && garbledWord.length > 0) {
                    garbledSentence += `${garbledWord[0].toUpperCase()}${garbledWord.slice(1)}`;
                } else {
                    garbledSentence += garbledWord;
                }
            } else {
                garbledSentence += word;
            }

            inOOC = false;
            word = "";
            caps = [];
            garbledSentence += char;
        }
    }
    return garbledSentence;
}
