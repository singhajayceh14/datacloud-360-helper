import { NextResponse } from "next/server";
import { ask, type ChatMessage } from "@/lib/ai";
import type { Provider } from "@/lib/ai/config";

type Body = {
  messages?: ChatMessage[];
  projectContext?: string;
  provider?: Provider;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { messages, projectContext, provider } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "A non-empty `messages` array is required." },
      { status: 400 },
    );
  }

  try {
    const text = await ask({ messages, projectContext, provider });
    return NextResponse.json({ text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
