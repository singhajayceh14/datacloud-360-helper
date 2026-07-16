import { PageHeader, Stub } from "@/components/ui";

export default function MappingPage() {
  return (
    <div>
      <PageHeader
        title="Data Mapping"
        sub="CSV → DLO/DMO field mapping with the correct person split and identity-field flags."
      />
      <Stub
        title="Data Mapping"
        blurb="Import a CSV, profile it, and auto-draft the DLO → DMO mapping (IDs → Party Identification, emails → Contact Point Email, consent → Communication Subscription)."
      />
    </div>
  );
}
