import "server-only";
import { cookies } from "next/headers";

const KEY = "activeProjectId";

export async function getActiveProjectId(): Promise<string | null> {
  const store = await cookies();
  return store.get(KEY)?.value ?? null;
}
