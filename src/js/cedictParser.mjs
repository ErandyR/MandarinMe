export async function loadCedict(path) {
    const raw = await fetch(path).then(r => r.text());

    const lines = raw
        .split("\n")
        .filter(line => !line.startsWith("#") && line.trim() !== "");

    const entries = lines.map(line => {
        const trad = line.split(" ")[0];
        const simp = line.split(" ")[1];
        const pinyin = line.match(/\[(.*?)\]/)?.[1] || "";
        const defs = line.split("/").slice(1, -1).join("; ");

        return {
            traditional: trad,
            simplified: simp,
            pinyin: pinyin,
            definitions: defs
        };
    });

    return entries;
}
