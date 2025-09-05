type ListOpts = { view?: string; maxRecords?: number };

export class AirtableAdapter {
  constructor(private apiKey: string, private baseId: string) {}

  private baseUrl(table: string) {
    return `https://api.airtable.com/v0/${this.baseId}/${encodeURIComponent(table)}`;
  }
  private headers() { return { Authorization: `Bearer ${this.apiKey}` }; }

  async listRecords(table: string, opts: ListOpts = {}) {
    const url = new URL(this.baseUrl(table));
    if (opts.view) url.searchParams.set("view", opts.view);
    if (opts.maxRecords) url.searchParams.set("maxRecords", String(opts.maxRecords));
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`Airtable ${res.status} ${res.statusText}`);
    return res.json();
  }

  async upsertDoc(table: string, slug: string, fields: Record<string, any>) {
    // Properly escape slug for Airtable formula using field reference syntax
    const escapedSlug = slug.replace(/'/g, "\\'").replace(/"/g, '\\"');
    const formula = `{Slug}="${escapedSlug}"`;
    const url = new URL(this.baseUrl(table));
    url.searchParams.set("filterByFormula", formula);
    url.searchParams.set("maxRecords", "1");
    const found = await fetch(url, { headers: this.headers() });
    if (!found.ok) throw new Error(`Airtable find failed: ${found.statusText}`);
    const json = await found.json();
    if (json.records?.length) {
      const id = json.records[0].id;
      const upd = await fetch(this.baseUrl(table), {
        method: "PATCH", headers: { ...this.headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ records: [{ id, fields: { Slug: slug, ...fields } }] })
      });
      if (!upd.ok) throw new Error(`Airtable update failed: ${upd.statusText}`);
      return upd.json();
    } else {
      const crt = await fetch(this.baseUrl(table), {
        method: "POST", headers: { ...this.headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ records: [{ fields: { Slug: slug, ...fields } }] })
      });
      if (!crt.ok) throw new Error(`Airtable create failed: ${crt.statusText}`);
      return crt.json();
    }
  }
}
