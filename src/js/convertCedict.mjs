import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Helper para __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths correctos
const inputPath = path.join(__dirname, "../data/cedict_ts.u8");
const outputPath = path.join(__dirname, "../json/cedict.json");

// Leer archivo
const raw = fs.readFileSync(inputPath, "utf8").split("\n");

// Regex CC-CEDICT estándar
const lineRegex = /^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/;

const entries = [];

for (const line of raw) {
    // Saltar comentarios
    if (line.startsWith("#") || line.startsWith("%") || !line.trim()) continue;

    const match = line.match(lineRegex);

    if (!match) continue;

    const [_, trad, simp, pinyin, defs] = match;

    entries.push({
        traditional: trad,
        simplified: simp,
        pinyin,
        definitions: defs.split("/"),
    });
}

// Guardar el JSON
fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2), "utf8");


