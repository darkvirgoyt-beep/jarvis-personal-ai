import { describe, expect, it } from "vitest";
import { parseJarvisSourceLedger } from "./jarvisResearch";

describe("parseJarvisSourceLedger", () => {
  it("keeps only unique valid HTTPS sources", () => {
    expect(parseJarvisSourceLedger(JSON.stringify([
      "https://example.com/report",
      "http://unsafe.example.com",
      "https://example.com/report",
      "not a url",
      42,
    ]))).toEqual(["https://example.com/report"]);
  });

  it("returns an empty ledger for malformed or non-array data", () => {
    expect(parseJarvisSourceLedger("not json")).toEqual([]);
    expect(parseJarvisSourceLedger(JSON.stringify({ source: "https://example.com" }))).toEqual([]);
  });
});
