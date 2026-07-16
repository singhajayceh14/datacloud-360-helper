"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setActiveProject(id: string) {
  const store = await cookies();
  if (id) {
    store.set("activeProjectId", id, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    store.delete("activeProjectId");
  }
  // Re-render every route so tabs pick up the new active project.
  revalidatePath("/", "layout");
}
