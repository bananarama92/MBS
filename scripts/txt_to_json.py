"""Script for converting ipa-dict .txt files into the .json format."""

from __future__ import annotations

import os
import argparse
import json


def main(path_inp: str | os.Pathlike[str], path_out: str | os.Pathlike[str]) -> None:
    dct: dict[str, list[str]] = {}
    with open(path_inp, "r", encoding="utf8") as f_inp:
        for line in f_inp:
            word, _, phonWord = line.partition("\t")
            if "," in phonWord:
                phonWord = phonWord.split(",")[0]

            # Convert the phonetic word into a list of phonetic syllables
            phonSyllables = (i.strip(" \n/") for i in phonWord.replace("ˈ", "ˌ").split("ˌ"))
            dct[word] = [i for i in phonSyllables if i]

    with open(path_out, "w", encoding="utf8") as f_out:
        json.dump(dct, f_out, ensure_ascii=False, indent=4)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        usage="python ./txt_to_json.py en_US.txt en_US.json",
        description=__doc__,
    )
    parser.add_argument("path_inp", help="Path to the .txt input file")
    parser.add_argument("path_out", help="Path to the .json output file")
    args = parser.parse_args()
    main(args.path_inp, args.path_out)
