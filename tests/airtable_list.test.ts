
import { describe, it, expect } from "vitest";
import "dotenv/config";
import { AirtableAdapter } from "../src/airtable/adapter.js";

describe("AirtableAdapter list", () => {
  it("lists records from table/view IDs", async () => {
    const apiKey = process.env.AIRTABLE_API_KEY || "";
    const baseId = process.env.AIRTABLE_BASE_ID || "";
    if (!apiKey || !baseId) throw new Error("Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID");

    const airtable = new AirtableAdapter(apiKey, baseId);
    const data = await airtable.listRecords("tbloZ8LbITEVCvBbK", {
      view: "viwPiqIWRBhdMMarV",
      maxRecords: 5
    });

    expect(Array.isArray(data.records) || Array.isArray(data)).toBe(true);
  }, 60_000);
});
