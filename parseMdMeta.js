const FRONT_MATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

const sanitizeNav = (value = "") =>
  String(value)
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "");

const parseMetaBlock = (raw = "") => {
  const meta = {};
  raw.split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx <= 0) {
      return;
    }
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key && value) {
      meta[key] = value;
    }
  });
  return meta;
};

const parseMdMeta = (content = "") => {
  const match = String(content).match(FRONT_MATTER_RE);
  if (!match) {
    return { meta: {}, body: content };
  }

  const meta = parseMetaBlock(match[1]);
  const body = String(content).slice(match[0].length);
  return { meta, body };
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

module.exports = {
  parseMdMeta,
  sanitizeNav,
  escapeHtml,
};
