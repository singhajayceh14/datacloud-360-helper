import { PageHeader, Stub } from "@/components/ui";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        sub="AI provider, API keys, default models, and the Supabase connection."
      />
      <Stub
        title="Settings"
        blurb="Choose the AI provider (Claude / Gemini), store BYO keys server-side, pick default models, and configure the Supabase connection."
      />
    </div>
  );
}
