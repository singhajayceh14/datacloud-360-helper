import { PageHeader, Stub } from "@/components/ui";

export default function EntitlementsPage() {
  return (
    <div>
      <PageHeader
        title="Entitlements"
        sub="Order-form credits/storage and the consumption calculator."
      />
      <Stub
        title="Entitlements"
        blurb="Capture the order form and run the consumption calculator on the current rate card, with runway-vs-entitlement warnings."
      />
    </div>
  );
}
