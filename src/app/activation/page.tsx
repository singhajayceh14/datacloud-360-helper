import { PageHeader, Stub } from "@/components/ui";

export default function ActivationPage() {
  return (
    <div>
      <PageHeader
        title="Activation"
        sub="Target registry and activation plan with cadence/consent warnings."
      />
      <Stub
        title="Activation"
        blurb="Register activation targets, build the activation plan, and surface cadence-vs-segment and consent warnings."
      />
    </div>
  );
}
