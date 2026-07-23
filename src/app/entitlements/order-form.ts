export type ExtractedCaps = {
  dataServicesCredits?: number;
  sandboxCredits?: number;
  flexCredits?: number;
  dataStorageTb?: number;
  contractStart?: string;
  orderEndDate?: string;
};

/** Extract text from the first pages of a PDF (pdf.js, loaded on demand). */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Worker matched to the installed version, fetched lazily.
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  let text = "";
  for (let p = 1; p <= Math.min(pdf.numPages, 8); p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    text += content.items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n";
  }
  return text;
}

/** Pull entitlement values out of extracted order-form text. */
export function extractCaps(text: string): ExtractedCaps {
  const num = (s: string) => parseFloat(s.replace(/[,\s]/g, "")) || 0;
  const out: ExtractedCaps = {};

  let m =
    text.match(/(?:data services|dc)\s*credits?[^\d]{0,40}([\d,]{4,})/i) ||
    text.match(/([\d,]{6,})\s*(?:data services\s*)?credits/i);
  if (m) out.dataServicesCredits = num(m[1]);

  m = text.match(/sandbox[^\d]{0,40}([\d,]{4,})/i);
  if (m) out.sandboxCredits = num(m[1]);

  m = text.match(/flex[^\d]{0,40}([\d,]{4,})/i);
  if (m) out.flexCredits = num(m[1]);

  m =
    text.match(/storage[^\d]{0,40}([\d.,]+)\s*TB/i) ||
    text.match(/storage[^\d]{0,40}([\d.,]+)/i);
  if (m) out.dataStorageTb = num(m[1]);

  const dates = [
    ...text.matchAll(/(\d{4}-\d{2}-\d{2})|(\d{1,2}\/\d{1,2}\/\d{4})/g),
  ].map((x) => x[0]);
  if (dates.length) {
    out.contractStart = dates[0];
    if (dates.length > 1) out.orderEndDate = dates[dates.length - 1];
  }

  return out;
}
