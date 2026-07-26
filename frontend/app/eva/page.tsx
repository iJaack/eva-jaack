import type { Metadata } from "next";
import Link from "next/link";
import EvaTokenLedger from "@/components/EvaTokenLedger";
import PageShell from "@/components/ui/PageShell";
import { protocol } from "@/lib/protocol";

export const metadata: Metadata = {
  title: "$EVA on Avalanche",
  description: "Inspect the canonical $EVA token contract, live metadata, and read-only holder state on Avalanche C-Chain.",
};

export default function EvaTokenPage() {
  const contractUrl = `${protocol.chain.explorerUrl}/address/${protocol.tokens.eva.address}`;

  return (
    <PageShell className="eva-token-page">
      <section className="eva-token-hero">
        <p className="eyebrow">Platform token / Avalanche C-Chain</p>
        <h1>$EVA, on Avalanche.</h1>
        <p>
          The Eva platform token is an inspectable part of the protocol record. Contract metadata and wallet balances
          are read directly from Avalanche C-Chain.
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
