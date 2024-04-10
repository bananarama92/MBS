import { range } from "lodash-es";

import { MBS_MOD_API } from "../common";

import _GAG_DATA from "./vendor/gag_data.json" assert { type: "JSON" };
import _PHONETIC_DICT from "./vendor/en_US.json" assert { type: "JSON" };

type PhoneticDict = Readonly<Record<string, undefined | readonly string[]>>;
type GagData = Readonly<Record<string, { readonly MUFFLE: number, readonly SOUND: string }>>;

const GAG_DATA: { readonly [k in keyof typeof _GAG_DATA]: GagData } = Object.freeze(_GAG_DATA);
const PHONETIC_DICT: PhoneticDict = Object.freeze(_PHONETIC_DICT);

export namespace GarbleOptions {
    export interface DropChars {
        /** The gag level */
        readonly level: number,
        /** The minimum gag level for which trailing characters will be dropped */
        readonly levelMin: number,
        /** The gag level at which the maximum amount of trailing characters will be dropped */
        readonly levelMax: number,
        /** The maximum fraction of dropped trailing characters */
        readonly maxFrac: number,
    }

    type Fallback = (args: Parameters<typeof SpeechGarbleByGagLevel>) => ReturnType<typeof SpeechGarbleByGagLevel>;

    export interface Base {
        readonly dropChars?: Omit<Partial<DropChars>, "level">,
        readonly character?: Character,
        readonly fallback?: Fallback,
        readonly ignoreOOC?: boolean,
    }

    export interface Parsed extends Record<keyof Base, unknown> {
        readonly dropChars: (word: string) => string,
        readonly character: null | Character,
        readonly fallback: Fallback,
        readonly ignoreOOC: boolean,
    }
}

export const GAG_LEVEL = Object.freeze({
    light: 3,
    medium: 6,
    heavy: 9,
    max: 20,
});

const PHONEMES_SYMBOLS_EN_US = Object.freeze(new Set([
    "aɪ", "aʊ", "b", "d", "dʒ", "eɪ", "f", "h", "i", "j", "k", "m", "n", "oʊ", "p", "s", "t",
    "tʃ", "u", "v", "w", "z", "æ", "ð", "ŋ", "ɑ", "ɔ", "ɔɪ", "ə", "ɛ", "ɝ", "ɡ", "ɪ", "ɪə", "ɫ",
    "ɹ", "ʃ", "ʊ", "ʒ", "θ",
]));

const LETTER_REGEX = /\p{L}/u;

/**
 * Convert a single English word to a list of its respective International Phonetic Alphabet (IPA) characters
 * @param word The to-be converted word
 * @returns The words IPA characters or `undefined` if the word is unknown
 */
function wordToIPA(word: string): undefined | string[] {
    const wordLower = word.toLowerCase();
    const phoneticSyllables = PHONETIC_DICT[wordLower];
    if (phoneticSyllables === undefined) {
        return undefined;
    }

    const phonetics: string[] = [];
    for (const syllable of phoneticSyllables) {
        let i = 0;
        while (i < syllable.length) {
            const char1 = syllable[i];
            const char12 = syllable.slice(i, i + 2);
            if (PHONEMES_SYMBOLS_EN_US.has(char12)) {
                phonetics.push(char12);
                i += 2;
            } else {
                phonetics.push(char1);
                i += 1;
            }
        }
    }
    return phonetics;
}

/** Drop trailing characters in the passed string depending on the gag level */
function dropTrailingChars(word: string, options: GarbleOptions.DropChars): string {
    const { level, levelMax, levelMin, maxFrac } = options;
    if (level < levelMin) {
        return word;
    }

    const wordArray = Array.from(word);
    const charFrac = Math.max(maxFrac, maxFrac * (level - levelMin) / (levelMax - levelMin));
    const nChars = Math.floor(wordArray.length * charFrac);
    return word.slice(0, wordArray.length - nChars).padEnd(wordArray.length - Math.floor(nChars / 2));
}

function parseOptions(options: null | GarbleOptions.Base, gagLevel: number): GarbleOptions.Parsed {
    let dropChars = (word: string) => word;
    if (options?.dropChars != null) {
        const dropCharsOptions: GarbleOptions.DropChars = {
            level: gagLevel,
            levelMin: options.dropChars.levelMin ?? GAG_LEVEL.heavy,
            levelMax: options.dropChars.levelMax ?? GAG_LEVEL.max,
            maxFrac: options.dropChars.maxFrac ?? 0.5,
        };
        dropChars = (word) => dropTrailingChars(word, dropCharsOptions);
    }

    return {
        dropChars,
        character: options?.character ?? null,
        fallback: options?.fallback ?? ((args) => MBS_MOD_API.callOriginal("SpeechGarbleByGagLevel", args)),
        ignoreOOC: options?.ignoreOOC ?? false,
    };
}

function getGagData(character: null | Character, gagLevel: number): GagData {
    if (character && character.HasEffect("OpenMouth") && !character.HasEffect("BlockMouth")) {
        return GAG_DATA["Ring Gag"];
    } else if (gagLevel <= GAG_LEVEL.light) {
        return GAG_DATA["Cleave Gag"];
    } else if (gagLevel <= GAG_LEVEL.medium) {
        return GAG_DATA["Ball Gag"];
    } else {
        return GAG_DATA["Dildo Gag"];
    }
}

export function convertToGagSpeak(
    sentence: string,
    gagLevel: number,
    options: null | GarbleOptions.Base = null,
): string {
    const { dropChars, fallback, character, ignoreOOC } = parseOptions(options, gagLevel);
    const gagData = getGagData(character, gagLevel);

    const oocIndices = new Set(SpeechGetOOCRanges(sentence).flatMap(({ start, length }) => {
        return range(start, start + length + 1);
    }));

    let garbledSentence = "";
    let word = "";
    let caps: boolean[] = [];
    let inOOC = false;
    const iMax = sentence.length - 1;
    for (const [i, char] of Array.from(sentence).entries()) {
        if (LETTER_REGEX.test(char) && i < iMax) {
            word += char;
            inOOC ||= oocIndices.has(i);
            caps.push(char.toUpperCase() === char);
            continue;
        }

        if (!word) {
            garbledSentence += fallback([gagLevel, char]);
            continue;
        }

        if (inOOC && !ignoreOOC) {
            // No Need for garbling while in OOC
            garbledSentence += word;
        } else {
            // Try the phonetics-based garbling and fall back to BC's default if no match is found for the word
            const phonetics = wordToIPA(word);
            if (phonetics) {
                const garbledWord = dropChars(phonetics.map(j => gagData[j]?.SOUND ?? "").join(""));
                if (caps.every(Boolean)) {
                    garbledSentence += garbledWord.toUpperCase();
                } else if (caps[0] && garbledWord.length > 0) {
                    garbledSentence += `${garbledWord[0].toUpperCase()}${garbledWord.slice(1)}`;
                } else {
                    garbledSentence += garbledWord;
                }
            } else {
                garbledSentence += fallback([gagLevel, char]);
            }
        }

        inOOC = false;
        word = "";
        caps = [];
        garbledSentence += char;
    }
    return garbledSentence;
}
