type ListArgs = {
  apiKey: string;
  baseId: string;
  table: string;
  maxRecords?: number;
  view?: string;
  filterByFormula?: string;
};

export async function listAirtableRecords(args: ListArgs) {
  const { apiKey, baseId, table, maxRecords, view, filterByFormula } = args;
  const url = new URL(`https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}`);
  if (maxRecords) url.searchParams.set("maxRecords", String(maxRecords));
  if (view) url.searchParams.set("view", view);
  if (filterByFormula) url.searchParams.set("filterByFormula", filterByFormula);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable ${res.status}: ${text}`);
  }
  return await res.json();
}
