import type { Metadata } from "next";
import Link from "next/link";
import EvaTokenLedger from "@/components/EvaTokenLedger";
import PageShell from "@/components/ui/PageShell";
import { protocol } from "@/lib/protocol";

export const metadata: Metadata = {
  title: "$EVA on Avalanche",
  description: "Inspect $EVA on Avalanche, use it for platform proofs, and create an onchain dead-address burn receipt.",
};

export default function EvaTokenPage() {
  const contractUrl = `${protocol.chain.explorerUrl}/address/${protocol.tokens.eva.address}`;

  return (
    <PageShell className="eva-token-page">
      <section className="eva-token-hero">
        <p className="eyebrow">Platform token / Avalanche C-Chain</p>
        <h1>$EVA, on Avalanche.</h1>
        <p>
          Read the canonical token directly from Avalanche. Public theses, revisions, and agent proof bundles consume
          an exact quoted amount of $EVA and retire it irreversibly with an onchain receipt.
        </p>
        <div className="eva-token-actions">
          <a className="eva-inline-link" href={contractUrl} target="_blank" rel="noreferrer">
            View contract →
          </a>
          <Link href="/compose">Start a thesis</Link>
        </div>
      </section>
      <EvaTokenLedger />
    </PageShell>
  );
}
