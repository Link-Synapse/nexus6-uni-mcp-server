/**
 * File-backed KV memory with TTL.
 * Shape: { [namespace]: { [key]: { value, expiresAt? } } }
 */
import fs from "fs";
import fse from "fs-extra";

export class Memory {
  constructor(filePath) {
    this.filePath = filePath;
    fse.ensureFileSync(this.filePath);
    if (!fs.readFileSync(this.filePath, "utf-8").trim()) {
      fs.writeFileSync(this.filePath, JSON.stringify({}, null, 2));
    }
    this._load();
  }
  _load() {
    try {
      this.db = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
    } catch {
      this.db = {};
    }
  }
  _save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.db, null, 2));
  }
  _now() { return Date.now(); }
  _purgeExpired(ns) {
    const n = this.db[ns] || {};
    let changed = false;
    for (const [k, v] of Object.entries(n)) {
      if (v && v.expiresAt && this._now() > v.expiresAt) {
        delete n[k];
        changed = true;
      }
    }
    if (changed) this._save();
  }
  set(namespace, key, value, ttlSeconds) {
    this.db[namespace] = this.db[namespace] || {};
    const entry = { value };
    if (ttlSeconds && Number(ttlSeconds) > 0) {
      entry.expiresAt = this._now() + Number(ttlSeconds) * 1000;
    }
    this.db[namespace][key] = entry;
    this._save();
  }
  get(namespace, key) {
    this._purgeExpired(namespace);
    const entry = this.db?.[namespace]?.[key];
    return entry ? entry.value : null;
  }
  list(namespace) {
    this._purgeExpired(namespace);
    return Object.keys(this.db?.[namespace] || {});
  }
}
