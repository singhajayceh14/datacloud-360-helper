import { NextResponse } from "next/server";
import { profileCsv } from "@/lib/mapping/profile";

type Body = { csv?: string; sourceName?: string };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const csv = body.csv ?? "";
  if (!csv.trim()) {
    return NextResponse.json({ error: "CSV content is empty." }, { status: 400 });
  }

  try {
    const result = profileCsv(csv, (body.sourceName ?? "").trim() || "Source");
    if (result.fields.length === 0) {
      return NextResponse.json(
        { error: "No columns found — is this a valid CSV with a header row?" },
        { status: 400 },
      );
    }
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
