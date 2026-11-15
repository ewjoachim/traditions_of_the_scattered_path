# Decipherment files

The sources of [glossary.md](../glossary.md) and [translation.md](../translation.md), plus two
small tools for reading the transcript. Everything runs with Python 3.9 or later and needs
nothing else installed.

| File | What it holds |
|---|---|
| `lexicon.tsv` | One row per word: proposed meaning and confidence (A, B or C, as defined in the glossary) |
| `translations.tsv` | One row per sentence: the English draft |
| `glossary_template.md`, `translation_header.md` | The hand-written parts of the two documents |
| `make_docs.py` | Rebuilds the two documents. Also holds the section titles, the names table and the grouping of the grammar words |
| `gloss.py` | Prints the booklet with a word-for-word gloss under each sentence |
| `kwic.py` | Prints every occurrence of a word with the words around it |
| `booklet.py` | Shared code: loads the transcript and the lexicon |

## Changing a meaning or a draft

1. Edit `lexicon.tsv` or `translations.tsv`. Columns are separated by tabs.
2. Run `python3 decipherment/make_docs.py`.

`glossary.md` and `translation.md` are overwritten on every run, so changes made directly
in them are lost.

The drafts are written by hand. Changing a meaning in `lexicon.tsv` does not change the
sentences that use the word; `kwic.py` lists them.

In `lexicon.tsv`:

- A word with two unrelated meanings has them separated by `|`, as in `may|true`.
- Names are written in capitals.
- A word that is not listed but is a listed word plus `-se`, `-oi`, `-b`, `-ye`, `-sa` or
  `-we` is glossed from that word (plural, possessive, -ed, -er, -s, adjective). Give the
  word its own row when that reading is wrong.

Sentences are numbered section.sentence, both starting at 0.

## Tools

```
python3 decipherment/gloss.py 7 8
python3 decipherment/kwic.py uamrb pai
```

`gloss.py` takes section numbers and prints the whole booklet when given none:

```
7.3  rt fatpt oe ade rpt oe tfe srligr
      is broken the path through the [tfe:1] gate
```

A `?` marks a meaning at confidence C. `[tfe:1]` is a word with no proposed meaning and
the number of times it occurs. `+PL`, `+'s`, `+ed`, `+er`, `+s` and `+adj` mark a listed
word with an ending.

`kwic.py` takes one or more words. `^` and `$` mark where the sentence starts or ends
within the words shown:

```
-- uamrb (5)
  2.19                  wt oept twt oa hayroi dictha rda [uamrb] rda hayroi ytotueb$
  10.6                   sihr oeur nena wawrge ur wrut oe [uamrb] $
```
