const fs = require("fs");
const path = require("path");

function toDataUrl(pngPath) {
  const buf = fs.readFileSync(pngPath);
  return "data:image/png;base64," + buf.toString("base64");
}

const topPath = path.resolve("components", "logo_top_right.png");
const bottomPath = path.resolve("components", "logo_bottom_left.png");

if (!fs.existsSync(topPath) || !fs.existsSync(bottomPath)) {
  console.error("Nenalezeny soubory s logy v ./components/. Ov�� n�zvy i um�st�n�.");
  process.exit(1);
}

const TOP = toDataUrl(topPath);
const BOTTOM = toDataUrl(bottomPath);

const out = `// components/logos.inline.ts � AUTOGENEROV�NO
export const TOP_RIGHT_B64 = "${TOP}";
export const BOTTOM_LEFT_B64 = "${BOTTOM}";
`;

fs.writeFileSync(path.resolve("components", "logos.inline.ts"), out, "utf8");
console.log("? Vytvo�eno: components/logos.inline.ts");