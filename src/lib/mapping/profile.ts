import type { MappingField } from "@/db/schema";

/** Minimal CSV parser: handles quoted fields, escaped quotes, CRLF. */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }

  const headers = (rows.shift() ?? []).map((h) => h.trim());
  return { headers, rows };
}

/**
 * Data 360 "person split" rules — infer the target DMO + category for a column
 * from its name (and a sample value). Mirrors the rules baked into the grounding:
 * IDs → Party Identification, emails → Contact Point Email,
 * consent → Communication Subscription, etc.
 */
export function inferField(
  column: string,
  sample: string | null,
): { dmo: string; category: string; identity: boolean } {
  const n = column.toLowerCase().replace(/[^a-z0-9]/g, "");
  const val = (sample ?? "").trim();

  const looksEmail = /@/.test(val) || /email|e-mail/.test(n);
  const looksPhone = /phone|mobile|cell|tel/.test(n);
  const looksConsent =
    /consent|optin|optout|subscrib|unsubscrib|marketing|permission|gdpr/.test(n);
  const looksId =
    /(^|.*)(id|guid|uuid|key)$/.test(n) ||
    /customerid|accountid|contactid|userid|externalid|memberid/.test(n);
  const looksName = /firstname|lastname|fullname|givenname|surname|(^name$)/.test(n);
  const looksAddress =
    /address|street|city|state|province|zip|postal|postcode|country|region/.test(n);
  const looksDate = /date|time|timestamp|created|updated|modified/.test(n);

  if (looksEmail)
    return { dmo: "Contact Point Email", category: "Contact Point", identity: true };
  if (looksPhone)
    return { dmo: "Contact Point Phone", category: "Contact Point", identity: true };
  if (looksConsent)
    return {
      dmo: "Communication Subscription",
      category: "Consent",
      identity: false,
    };
  if (looksId)
    return {
      dmo: "Party Identification",
      category: "Identity",
      identity: true,
    };
  if (looksName)
    return { dmo: "Individual", category: "Party", identity: false };
  if (looksAddress)
    return {
      dmo: "Contact Point Address",
      category: "Contact Point",
      identity: false,
    };
  if (looksDate)
    return { dmo: "Attribute", category: "Attribute", identity: false };

  return { dmo: "Attribute", category: "Attribute", identity: false };
}

/** Profile a CSV and produce a draft DLO→DMO mapping. */
export function profileCsv(
  csv: string,
  sourceName: string,
): { headers: string[]; rowsSampled: number; fields: MappingField[] } {
  const { headers, rows } = parseCsv(csv);
  const dlo = sourceName || "Source";

  const fields: MappingField[] = headers.map((column, idx) => {
    const sample =
      rows.map((r) => r[idx]).find((v) => v && v.trim() !== "")?.trim() ?? null;
    const { dmo, category, identity } = inferField(column, sample);
    return { column, sample, dlo, dmo, category, identity };
  });

  return { headers, rowsSampled: rows.length, fields };
}
