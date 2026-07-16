import { NextResponse } from "next/server";
import { searchConnectors } from "@/lib/connectors";

export function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const release = url.searchParams.get("release") ?? "";
  const limitRaw = Number(url.searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 500)
    : 100;

  return NextResponse.json(searchConnectors({ q, release, limit }));
}
