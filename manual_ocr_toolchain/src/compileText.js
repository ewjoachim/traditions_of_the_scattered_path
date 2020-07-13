const fs = require("fs");

const characterMapping = {
  " ": " ",
  "-": "-",
  ".": ".",
  "!": "!",
  "00": "e",
  "01": "t",
  "02": "a",
  "03": "r",
  "04": "i",
  "05": "o",
  "06": "n",
  "07": "s",
  "08": "h",
  "09": "d",
  "10": "l",
  "11": "u",
  "12": "w",
  "13": "m",
  "14": "f",
  "15": "c",
  "16": "g",
  "17": "y",
  "18a": "p",
  "18b": "",
  "19": "b",
  "20": "k",
  "21": "v",
};

const sortedGlyphsPath = "./sorted_glyphs";

const compileText = async () => {
  const characters = fs
    .readdirSync(sortedGlyphsPath)
    .filter((fileName) => fileName.startsWith("_"))
    .map((fileName) => [fileName, `${sortedGlyphsPath}/${fileName}`])
    .filter(([_, path]) => fs.lstatSync(path).isDirectory())
    .map(([folderName, path]) =>
      fs
        .readdirSync(path)
        .filter((fileName) => fileName.endsWith(".png"))
        .map((fileName) => {
          const [
            pageIndex,
            columnIndex,
            lineIndex,
            charIndex,
          ] = fileName.replace(".png", "").split("_");
          const char = characterMapping[folderName.replace("_", "")];
          const lineID = `${pageIndex}_${columnIndex}_${lineIndex}`;
          return {
            lineID,
            charIndex: parseInt(charIndex),
            char,
          };
        })
    )
    .flat();

  const allLineIDs = Array.from(
    new Set(characters.map(({ lineID }) => lineID))
  ).sort();

  const lines = allLineIDs.map((lineID) => {
    const [pageIndex, columnIndex, lineIndex] = lineID.split("_");
    return {
      pageIndex,
      columnIndex,
      lineIndex,
      text: characters
        .filter((char) => lineID === char.lineID)
        .sort((p, q) => p.charIndex - q.charIndex)
        .map(({ char }) => char)
        .join(""),
    };
  });

  const clumps = lines.reduce((clumpsSoFar, line) => {
    const { pageIndex, columnIndex, lineIndex } = line;

    const lastClump = clumpsSoFar[clumpsSoFar.length - 1];
    let appendLastClump = false;
    if (
      lastClump != null &&
      lastClump.pageIndex === pageIndex &&
      lastClump.columnIndex === columnIndex
    ) {
      const lastLineIndex =
        lastClump.lines[lastClump.lines.length - 1].lineIndex;
      if (lineIndex - lastLineIndex === 2) {
        appendLastClump = true;
      }
    }

    if (appendLastClump) {
      lastClump.lines.push(line);
    } else {
      clumpsSoFar.push({
        pageIndex,
        columnIndex,
        lineIndex,
        lines: [line],
      });
    }

    return clumpsSoFar;
  }, []);

  const wholeText = clumps.map((clump) => printClump(clump)).join("\n\n");
  fs.writeFileSync(`./compiled_text.txt`, wholeText);
};

const printClump = ({ pageIndex, columnIndex, lineIndex, lines }) =>
  [
    `page ${pageIndex} column ${columnIndex} line ${lineIndex}:`,
    ...lines.map(({ text }) => text),
  ].join("\n\t");

module.exports = { compileText };
