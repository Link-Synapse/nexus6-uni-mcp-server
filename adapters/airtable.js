/**
 * Airtable adapter: minimal Docs interface
 * Expect config/airtable.json:
 * {
 *   "api_key": "...",
 *   "base_id": "...",
 *   "tables": { "docs": "Docs", "tasks": "Research_Tasks" }
 * }
 */
import Airtable from "airtable";

export class AirtableAdapter {
  constructor(cfg = {}) {
    this.apiKey = cfg.api_key || process.env.AIRTABLE_API_KEY;
    this.baseId = cfg.base_id || process.env.AIRTABLE_BASE_ID;
    this.tableDocs = cfg.tables?.docs || "Docs";
    if (!this.apiKey || !this.baseId) {
      console.warn("[Airtable] Missing api_key/base_id – some routes will fail until configured.");
      this.client = null;
      return;
    }
    Airtable.configure({ apiKey: this.apiKey });
    this.base = Airtable.base(this.baseId);
  }

  async listDocs(project) {
    if (!this.base) return [];
    const filter = project ? `({Project} = '${project}')` : "";
    const records = await this.base(this.tableDocs).select({ filterByFormula: filter || undefined }).all();
    return records.map(r => ({
      id: r.id,
      slug: r.get("Slug"),
      name: r.get("Name"),
      status: r.get("Status"),
      project: r.get("Project") || null,
      updated: r.get("Updated") || null
    }));
  }

  async readDoc(project, slug) {
    if (!this.base) throw new Error("airtable_not_configured");
    const filter = `AND({Slug} = '${slug}', {Project} = '${project}')`;
    const recs = await this.base(this.tableDocs).select({ filterByFormula: filter, maxRecords: 1 }).all();
    const r = recs[0];
    if (!r) return null;
    return {
      id: r.id,
      slug: r.get("Slug"),
      name: r.get("Name") || r.get("Slug"),
      status: r.get("Status") || "draft",
      project: r.get("Project") || project,
      content: r.get("Content") || ""
    };
  }

  // Optional write (not used by push flow in Phase 1)
  async writeDoc(project, slug, name, content, status = "draft") {
    if (!this.base) throw new Error("airtable_not_configured");
    const created = await this.base(this.tableDocs).create({
      Project: project, Slug: slug, Name: name, Content: content, Status: status
    });
    return { id: created.id };
  }
}
