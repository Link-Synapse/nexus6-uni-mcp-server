export class AirtableAdapter {
  private apiKey: string;
  private baseUrl = "https://api.airtable.com/v0";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async listRecords(baseId: string, tableId: string, options: { maxRecords?: number } = {}) {
    const url = new URL(`${this.baseUrl}/${baseId}/${tableId}`);
    if (options.maxRecords) url.searchParams.set("maxRecords", options.maxRecords.toString());

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${this.apiKey}` }
    });

    if (!res.ok) {
      throw new Error(`Airtable API error: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  }
}
