const fs = require("fs");
const path = require("path");

function toDataUrl(pngPath) {
  const buf = fs.readFileSync(pngPath);
  return "data:image/png;base64," + buf.toString("base64");
}

const topPath = path.resolve("components", "logo_top_right.png");
const bottomPath = path.resolve("components", "logo_bottom_left.png");

if (!fs.existsSync(topPath) || !fs.existsSync(bottomPath)) {
  console.error("Nenalezeny soubory s logy v ./components/. Ovìø názvy i umístìní.");
  process.exit(1);
}

const TOP = toDataUrl(topPath);
const BOTTOM = toDataUrl(bottomPath);

const out = `// components/logos.inline.ts — AUTOGENEROVÁNO
export const TOP_RIGHT_B64 = "${TOP}";
export const BOTTOM_LEFT_B64 = "${BOTTOM}";
`;

fs.writeFileSync(path.resolve("components", "logos.inline.ts"), out, "utf8");
console.log("? Vytvoøeno: components/logos.inline.ts");