import sys

from booklet import COUNT, SENTS

WINDOW = 7

for word in sys.argv[1:]:
    print(f"-- {word} ({COUNT[word]})")
    for i, j, sentence in SENTS:
        for k, other in enumerate(sentence):
            if other != word:
                continue
            left = " ".join(sentence[max(0, k - WINDOW):k])
            right = " ".join(sentence[k + 1:k + 1 + WINDOW])
            start = "^" if k <= WINDOW else " "
            end = "$" if k + 1 + WINDOW >= len(sentence) else " "
            print(f"  {i}.{j:<2} {start}{left:>48} [{word}] {right}{end}")
