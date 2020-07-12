const fs = require("fs");
const PNG = require("pngjs").PNG;

const linesPath = "./lines";
const glyphsPath = "./glyphs";

const loadLinePNG = (fileName) =>
  new Promise((resolve) =>
    fs
      .createReadStream(`${linesPath}/${fileName}`)
      .pipe(new PNG({ filterType: 4 }))
      .on("parsed", function () {
        resolve(this);
      })
  );

const saveGlyphPNG = (fileName, index, data) =>
  new Promise((resolve) => {
    fileName = fileName.replace(".png", `_${index}.png`);
    const height = data[0].length;
    const width = data.length;
    const png = new PNG({ filterType: 4, width, height });
    const rotatedData = Array(height)
      .fill()
      .map((_, y) =>
        Array(width)
          .fill()
          .map((_, x) => Math.floor(data[x][height - y - 1]))
      );
    // console.log(printStrips(rotatedData));
    // return;
    png.data = Buffer.from(
      rotatedData
        .flat()
        .map((value) => [value, value, value, 0xff])
        .flat()
    );
    png
      .pack()
      .pipe(fs.createWriteStream(`${glyphsPath}/${fileName}`))
      .on("finish", function () {
        resolve();
      });
  });

const printStrips = (strips, displayThreshold = 0x88) =>
  [
    Array(strips[0].length * 3 + 2)
      .fill("-")
      .join(""),
    ...strips.map(
      (strip) =>
        "|" +
        strip
          .map((value) =>
            value > displayThreshold
              ? "   "
              : value.toString(16).padStart(2, "0") + " "
          )
          .join("") +
        "|"
    ),
    Array(strips[0].length * 3 + 2)
      .fill("-")
      .join(""),
  ].join("\n");

const processLine = async (fileName, png) => {
  const { width, height, data } = png;

  const greenPixelValues = Array(data.length / 4)
    .fill()
    .map((_, index) =>
      Math.min(data[index * 4 + 0], data[index * 4 + 1], data[index * 4 + 2])
    );

  const valueThreshold = 0x70;
  const coverageThreshold = 2;

  const allStrips = Array(width)
    .fill()
    .map((_, x) =>
      Array(height)
        .fill()
        .map((_, y) => greenPixelValues[(height - y - 1) * width + x])
    );

  const spaceStrip = Array(15).fill(0xff);

  const glyphs = allStrips
    .reduce((glyphsSoFar, strip) => {
      const isStripEmpty =
        strip.filter((value) => value < valueThreshold).length <
        coverageThreshold;
      if (isStripEmpty) {
        strip = spaceStrip;
      }
      let latestGlyph = glyphsSoFar[glyphsSoFar.length - 1];
      if (
        isStripEmpty !== (latestGlyph != null && latestGlyph[0] === spaceStrip)
      ) {
        latestGlyph = [];
        glyphsSoFar.push(latestGlyph);
      }
      latestGlyph.push(strip);
      return glyphsSoFar;
    }, [])
    .filter(
      (glyph, index, { length }) =>
        glyph[0] !== spaceStrip ||
        (glyph.length > 10 && index > 0 && index < length - 1)
    )
    .filter((glyph) => glyph[0].length >= 5 && glyph.length >= 5)
    .map((glyph) => {
      if (glyph[0] === spaceStrip) {
        return Array(5).fill(spaceStrip);
      }
      const min = Math.min(
        ...glyph.map((strip) =>
          strip.findIndex((value) => value <= valueThreshold)
        )
      );
      const max = Math.max(
        ...glyph.map(
          (strip) =>
            strip.length -
            strip
              .slice()
              .reverse()
              .findIndex((value) => value <= valueThreshold)
        )
      );
      return glyph.map((strip) => strip.slice(min, max));
    });

  await Promise.all(
    glyphs.map((glyph, index) => saveGlyphPNG(fileName, index, glyph))
  );
};

const generateGlyphs = async () => {
  const imageNames = fs
    .readdirSync(linesPath)
    .filter((name) => name.endsWith(".png"));

  const images = await Promise.all(
    imageNames
      // .slice(0, 1)
      .map((fileName) =>
        loadLinePNG(fileName).then((png) => processLine(fileName, png))
      )
  );
};

module.exports = { generateGlyphs };
