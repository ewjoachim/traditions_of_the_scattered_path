import sys

from booklet import SECS, gloss

for i in [int(arg) for arg in sys.argv[1:]] or range(len(SECS)):
    print(f"===== section {i}")
    for j, sentence in enumerate(SECS[i]):
        print(f"{i}.{j}  {' '.join(sentence)}")
        print(f"      {' '.join(gloss(word) for word in sentence)}")
