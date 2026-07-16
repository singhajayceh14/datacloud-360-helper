import { Banner, Card, PageHeader, Pill } from "@/components/ui";
import { isDbConfigured } from "@/db";
import {
  DEFAULT_CLAUDE_MODEL,
  DEFAULT_GEMINI_MODEL,
  providerStatus,
} from "@/lib/ai/config";
import { connectorCount } from "@/lib/connectors";

export const dynamic = "force-dynamic";

function StatusRow({
  label,
  ok,
  okText = "Ready",
  offText = "Not set",
  detail,
}: {
  label: string;
  ok: boolean;
  okText?: string;
  offText?: string;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line/60 py-2 last:border-0">
      <div>
        <div className="text-[14px]">{label}</div>
        {detail && <div className="text-[12px] text-muted">{detail}</div>}
      </div>
      <Pill tone={ok ? "ga" : "beta"}>{ok ? okText : offText}</Pill>
    </div>
  );
}

export default function SettingsPage() {
  const db = isDbConfigured();
  const ai = providerStatus();
  const claudeModel = process.env.CLAUDE_MODEL || DEFAULT_CLAUDE_MODEL;
  const geminiModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const connectors = connectorCount();

  return (
    <div>
      <PageHeader
        title="Settings"
        sub="Connection & provider status. Keys live server-side in .env.local — never in the browser or the repo."
      />

      <Card>
        <h2 className="mb-2 font-semibold">Database</h2>
        <StatusRow
          label="Supabase / Postgres"
          ok={db}
          okText="Connected"
          offText="Not connected"
          detail={
            db
              ? "DATABASE_URL is set."
              : "Set DATABASE_URL in .env.local, then run npm run db:migrate."
          }
        />
      </Card>

      <Card>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="font-semibold">AI assistant</h2>
          <Pill tone={ai.ready ? "ga" : "beta"}>
            {ai.ready ? `active: ${ai.active}` : "no provider"}
          </Pill>
        </div>
        <StatusRow
          label="Anthropic (Claude)"
          ok={ai.anthropic}
          detail={`Model: ${claudeModel} · key: ANTHROPIC_API_KEY`}
        />
        <StatusRow
          label="Google (Gemini)"
          ok={ai.gemini}
          detail={`Model: ${geminiModel} · key: GOOGLE_GENERATIVE_AI_API_KEY`}
        />
        {!ai.ready && (
          <Banner tone="warn">
            No AI key detected. Add{" "}
            <code className="rounded bg-white/60 px-1">ANTHROPIC_API_KEY</code>{" "}
            or{" "}
            <code className="rounded bg-white/60 px-1">
              GOOGLE_GENERATIVE_AI_API_KEY
            </code>{" "}
            to <code className="rounded bg-white/60 px-1">.env.local</code> and
            restart the dev server.
          </Banner>
        )}
        {ai.ready && (
          <p className="mt-2 text-[12px] text-muted">
            Anthropic is preferred whenever its key is present; otherwise the
            assistant falls back to Gemini.
          </p>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 font-semibold">Reference data</h2>
        <StatusRow
          label="Connector catalog"
          ok={connectors > 0}
          okText={`${connectors} connectors`}
          offText="Empty"
          detail="Bundled from reference/connectors.json."
        />
      </Card>

      <Banner tone="info">
        <strong>Editing settings.</strong> This build reads all keys and models
        from <code className="rounded bg-white/60 px-1">.env.local</code>{" "}
        (server-side). Change a value there and restart{" "}
        <code className="rounded bg-white/60 px-1">npm run dev</code> — there is
        no browser-side key entry by design, so secrets never reach the client
        or the public repo.
      </Banner>
    </div>
  );
}
