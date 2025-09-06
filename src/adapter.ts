// src/airtable/adapter.ts
// Minimal Airtable adapter with safe JSON typing

export interface AirtableRecord<T = Record<string, unknown>> {
  id: string;
  fields: T;
  createdTime?: string;
}

export interface ListOptions {
  maxRecords?: number;
  view?: string;
  filterByFormula?: string;
}

export class AirtableAdapter {
  constructor(private apiKey: string, private baseId: string) {}

  private headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json"
    };
  }

  private baseUrl(table: string) {
    return `https://api.airtable.com/v0/${encodeURIComponent(this.baseId)}/${encodeURIComponent(
      table
    )}`;
  }

  async listRecords<T = Record<string, unknown>>(
    table: string,
    opts: ListOptions = {}
  ): Promise<AirtableRecord<T>[]> {
    const url = new URL(this.baseUrl(table));
    if (opts.maxRecords) url.searchParams.set("maxRecords", String(opts.maxRecords));
    if (opts.view) url.searchParams.set("view", opts.view);
    if (opts.filterByFormula) url.searchParams.set("filterByFormula", opts.filterByFormula);

    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Airtable ${res.status}: ${text}`);
    }
    const json: any = await res.json(); // safe cast
    return (json?.records ?? []) as AirtableRecord<T>[];
  }

  /**
   * Upsert by searching a single record with a filter formula; if found, update; else create.
   */
  async upsertByFormula<T = Record<string, unknown>>(
    table: string,
    filterByFormula: string,
    fields: T
  ): Promise<AirtableRecord<T>> {
    // 1) find existing
    const findUrl = new URL(this.baseUrl(table));
    findUrl.searchParams.set("maxRecords", "1");
    findUrl.searchParams.set("filterByFormula", filterByFormula);
    const found = await fetch(findUrl, { headers: this.headers() });
    if (!found.ok) {
      const text = await found.text();
      throw new Error(`Airtable find ${found.status}: ${text}`);
    }
    const json: any = await found.json(); // safe cast

    if (json?.records?.length) {
      const id = json.records[0].id as string;
      // update
      const upd = await fetch(this.baseUrl(table), {
        method: "PATCH",
        headers: this.headers(),
        body: JSON.stringify({ records: [{ id, fields }] })
      });
      if (!upd.ok) {
        const text = await upd.text();
        throw new Error(`Airtable update ${upd.status}: ${text}`);
      }
      const updJson: any = await upd.json();
      return (updJson?.records?.[0] ?? { id, fields }) as AirtableRecord<T>;
    } else {
      // create
      const crt = await fetch(this.baseUrl(table), {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ records: [{ fields }] })
      });
      if (!crt.ok) {
        const text = await crt.text();
        throw new Error(`Airtable create ${crt.status}: ${text}`);
      }
      const crtJson: any = await crt.json();
      return (crtJson?.records?.[0] ??
        { id: "new", fields }) as AirtableRecord<T>;
    }
  }
}
