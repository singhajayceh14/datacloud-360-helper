import { Banner, PageHeader } from "@/components/ui";
import { providerStatus } from "@/lib/ai/config";
import { Chat } from "./Chat";

export const dynamic = "force-dynamic";

export default function AssistantPage() {
  const status = providerStatus();

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Assistant"
        sub={`Grounded, project-aware AI answering from the Data 360 reference · provider: ${status.active}`}
      />

      {!status.ready && (
        <Banner tone="info">
          <strong>No AI key configured yet.</strong> Add{" "}
          <code className="rounded bg-white/60 px-1">ANTHROPIC_API_KEY</code>{" "}
          (or{" "}
          <code className="rounded bg-white/60 px-1">
            GOOGLE_GENERATIVE_AI_API_KEY
          </code>
          ) to <code className="rounded bg-white/60 px-1">.env.local</code> and
          restart the dev server to chat.
        </Banner>
      )}

      <Chat ready={status.ready} />
    </div>
  );
}
