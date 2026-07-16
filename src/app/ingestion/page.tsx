import { Card, PageHeader, Pill } from "@/components/ui";
import { connectorCount } from "@/lib/connectors";
import { ConnectorSearch } from "./ConnectorSearch";

export default function IngestionPage() {
  const count = connectorCount();

  return (
    <div>
      <PageHeader
        title="Ingestion"
        sub="Search the connector catalog, capture the source inventory, and design the ingestion architecture."
      />

      <Card>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-semibold">Connector catalog</h2>
          <Pill tone="ga">{count} connectors</Pill>
        </div>
        <ConnectorSearch />
      </Card>

      <Card>
        <div className="mb-1 flex items-center gap-2">
          <h2 className="font-semibold">Source inventory &amp; CSV uploads</h2>
          <Pill tone="beta">Next</Pill>
        </div>
        <p className="text-[13px] text-muted">
          Upload client CSV exports and build the per-project source inventory —
          arrives with Supabase Storage. The systems → Data 360 architecture
          diagram follows.
        </p>
      </Card>
    </div>
  );
}
