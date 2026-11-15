import collections
import csv
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent

SUFFIXES = [("se", "+PL"), ("oi", "+'s"), ("b", "+ed"), ("ye", "+er"), ("sa", "+s"), ("we", "+adj")]
# Words that end like a suffixed form of a known word but are not one.
NOT_SUFFIXED = {"tese"}


def read_tsv(name, columns):
    rows = []
    with open(HERE / name, encoding="utf-8", newline="") as file:
        reader = csv.reader(file, delimiter="\t", quoting=csv.QUOTE_NONE)
        if next(reader) != columns:
            raise ValueError(f"{name}: the first line must be {columns}")
        for number, row in enumerate(reader, start=2):
            if not row:
                continue
            if len(row) != len(columns) or not all(row):
                raise ValueError(f"{name} line {number}: expected {len(columns)} tab-separated values")
            rows.append(row)
    return rows


def load_sections():
    text = (REPO / "transcript" / "joined_text.txt").read_text(encoding="utf-8")
    body = text[text.index("•rt oine"):text.index("Descriptions of figures")]
    body = re.sub(r"\[\d+\]|\(\d+\)|[|]", " ", body)
    return [
        [sentence.split() for sentence in section.split(".") if sentence.split()]
        for section in body.split("•")
        if section.strip()
    ]


def load_lexicon():
    lexicon = {}
    for word, meaning, confidence in read_tsv("lexicon.tsv", ["word", "meaning", "confidence"]):
        if word in lexicon:
            raise ValueError(f"lexicon.tsv: {word} is listed twice")
        if confidence not in ("A", "B", "C"):
            raise ValueError(f"lexicon.tsv: {word} has confidence {confidence}, expected A, B or C")
        lexicon[word] = (meaning, confidence)
    return lexicon


SECS = load_sections()
SENTS = [(i, j, sentence) for i, section in enumerate(SECS) for j, sentence in enumerate(section)]
COUNT = collections.Counter(word for _, _, sentence in SENTS for word in sentence)
LEX = load_lexicon()


def split_suffix(word):
    if word not in LEX and word not in NOT_SUFFIXED:
        for suffix, tag in SUFFIXES:
            if word.endswith(suffix) and word[: -len(suffix)] in LEX:
                return word[: -len(suffix)], tag
    return None, None


def lookup(word):
    if word in LEX:
        return LEX[word]
    stem, tag = split_suffix(word)
    if stem is None:
        return None
    meaning, confidence = LEX[stem]
    return meaning + tag, confidence


def gloss(word):
    entry = lookup(word)
    if entry is None:
        return f"[{word}:{COUNT[word]}]"
    meaning, confidence = entry
    return meaning + ("?" if confidence == "C" else "")
