import { PageHeader, Stub } from "@/components/ui";

export default function AssistantPage() {
  return (
    <div>
      <PageHeader
        title="Assistant"
        sub="Grounded, project-aware AI (Claude or Gemini) answering from the Data 360 reference."
      />
      <Stub
        title="Assistant"
        blurb="A grounded chat assistant that answers from the curated Data 360 knowledge base and the current project context."
      />
    </div>
  );
}
