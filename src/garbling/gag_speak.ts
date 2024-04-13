import { range, zip } from "lodash-es";

import { MBS_MOD_API } from "../common";
import { json, GagData } from "./json";

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
        readonly perSyllable?: boolean,
    }

    export interface Parsed extends Record<keyof Base, unknown> {
        readonly dropChars: (word: string) => string,
        readonly character: null | Character,
        readonly fallback: Fallback,
        readonly ignoreOOC: boolean,
        readonly perSyllable: boolean,
    }
}

type GagLevel = typeof GagLevel[keyof typeof GagLevel];
export const GagLevel = Object.freeze({
    LIGHT: 3,
    MEDIUM: 6,
    HEAVY: 9,
    KILO_HEAVY: 12,
    MEGA_HEAVY: 15,
    GIGA_HEAVY: 18,
    MAX: 21,
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
 * @returns The words IPA characters per syllable or `undefined` if the word is unknown
 */
function wordToIPA(word: string): undefined | string[][] {
    const wordLower = word.toLowerCase();
    const phoneticSyllables = json.phoneticDict[wordLower];
    if (phoneticSyllables === undefined) {
        return undefined;
    }

    const phonetics: string[][] = range(0, phoneticSyllables.length).map(_ => []);
    for (const items of zip(phoneticSyllables, phonetics)) {
        const [syllable, phoneticsList] = items as [string, string[]];
        let i = 0;
        while (i < syllable.length) {
            const char1 = syllable[i];
            const char12 = syllable.slice(i, i + 2);
            if (PHONEMES_SYMBOLS_EN_US.has(char12)) {
                phoneticsList.push(char12);
                i += 2;
            } else {
                phoneticsList.push(char1);
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
            levelMin: options.dropChars.levelMin ?? GagLevel.HEAVY,
            levelMax: options.dropChars.levelMax ?? GagLevel.MAX,
            maxFrac: options.dropChars.maxFrac ?? 0.5,
        };
        dropChars = (word) => dropTrailingChars(word, dropCharsOptions);
    }

    return {
        dropChars,
        character: options?.character ?? null,
        fallback: options?.fallback ?? ((args) => MBS_MOD_API.callOriginal("SpeechGarbleByGagLevel", args)),
        ignoreOOC: options?.ignoreOOC ?? false,
        perSyllable: options?.perSyllable ?? false,
    };
}

function getGagData(
    character: null | Character,
    gagLevel: number,
    syllableOptions: null | { readonly syllable: number, readonly syllableMax: number } = null,
): GagData {
    if (character && character.HasEffect("OpenMouth") && !character.HasEffect("BlockMouth")) {
        return json.gagData["Ring Gag"] ?? {};
    }

    syllableOptions: if (syllableOptions !== null) {
        const gagLevelRound = Math.floor(gagLevel / 3);
        if (gagLevelRound === 0) {
            break syllableOptions;
        }

        const frac = (gagLevel / 3) - gagLevelRound;
        if (frac > (syllableOptions.syllable / syllableOptions.syllableMax)) {
            gagLevel = (1 + gagLevelRound) * 3;
        }
    }

    if (gagLevel <= GagLevel.LIGHT) {
        return json.gagData["Cleave Gag"] ?? {};
    } else if (gagLevel <= GagLevel.MEDIUM) {
        return json.gagData["Ball Gag"] ?? {};
    } else {
        return json.gagData["Dildo Gag"] ?? {};
    }
}

/** Cut a sentence into OOC and non-OOC chunks */
function sentenceCutOOC(sentence: string, ignoreOOC: boolean = false): { words: string, ooc: boolean }[] {
    const oocIter = SpeechGetOOCRanges(sentence).values();
    let oocNext = oocIter.next();
    if (oocNext.done || ignoreOOC) {
        return [{ words: sentence, ooc: false }];
    }

    const ret: { words: string, ooc: boolean}[] = [];
    let start = 0;
    while (!oocNext.done) {
        const oocStart = oocNext.value.start;
        const oocStop = oocStart + oocNext.value.length;
        ret.push({ words: sentence.slice(start, oocStart), ooc: false });
        ret.push({ words: sentence.slice(oocStart, oocStop), ooc: true });
        oocNext = oocIter.next();
        start = oocStop;
    }
    ret.push({ words: sentence.slice(start), ooc: false });
    return ret;
}

export function convertToGagSpeak(
    sentence: string,
    gagLevel: number,
    options: null | GarbleOptions.Base = null,
): string {
    const { dropChars, fallback, character, ignoreOOC, perSyllable } = parseOptions(options, gagLevel);

    let garbledSentence = "";
    const sentenceFragments = sentenceCutOOC(sentence, ignoreOOC);
    for (const sentenceFrag of sentenceFragments) {
        // Got an OOC fragment here; no need to garble anything
        if (sentenceFrag.ooc) {
            garbledSentence += sentenceFrag.words;
            continue;
        }

        let word = "";
        let caps: boolean[] = [];
        const iMax = sentenceFrag.words.length - 1;
        for (const [i, char] of Array.from(sentenceFrag.words).entries()) {
            // Keep constructing  as long as unicode letter characters are coming through
            const charIsLetter = LETTER_REGEX.test(char);
            if (charIsLetter) {
                word += char;
                caps.push(char.toUpperCase() === char);
                if (i < iMax) {
                    continue;
                }
            }

            // Try the phonetics-based garbling and fall back to BC's default if no match is found for the word
            const phonWord = wordToIPA(word);
            if (phonWord) {
                const garbledWord = dropChars(phonWord.flatMap((phonSyllable, j) => {
                    const syllableOptions = perSyllable ? { syllable: j + 1, syllableMax: phonWord.length } : null;
                    const gagData = getGagData(character, gagLevel, syllableOptions);
                    return phonSyllable.map(phonChar => gagData[phonChar]?.SOUND ?? "");
                }).join(""));

                if (caps.every(Boolean)) {
                    garbledSentence += garbledWord.toUpperCase();
                } else if (caps[0] && garbledWord.length > 0) {
                    garbledSentence += `${garbledWord[0].toUpperCase()}${garbledWord.slice(1)}`;
                } else {
                    garbledSentence += garbledWord;
                }
            } else {
                garbledSentence += fallback([gagLevel, word]);
            }

            word = "";
            caps = [];
            if (!charIsLetter) {
                // Avoid double garbling `char` if it's a letter
                garbledSentence += fallback([gagLevel, char]);
            }
        }
    }
    return garbledSentence;
}
