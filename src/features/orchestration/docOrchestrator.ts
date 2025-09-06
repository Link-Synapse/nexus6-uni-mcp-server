import { createHash } from "crypto";

export interface SplitResult {
  chunks: string[];
  approxTokens: number;
}

export function splitTextByTokens(text: string, targetTokens = 800): SplitResult {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let bucket: string[] = [];
  let tokCount = 0;
  const tok = (s: string) => Math.ceil(s.length / 4); // crude token estimator

  for (const w of words) {
    const wTok = tok(w + " ");
    if (tokCount + wTok > targetTokens && bucket.length) {
      chunks.push(bucket.join(" "));
      bucket = [];
      tokCount = 0;
    }
    bucket.push(w);
    tokCount += wTok;
  }
  if (bucket.length) chunks.push(bucket.join(" "));
  return { chunks, approxTokens: chunks.reduce((a, c) => a + tok(c), 0) };
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}
