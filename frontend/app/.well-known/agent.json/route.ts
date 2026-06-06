import { NextResponse } from "next/server";
import { protocol } from "@/lib/protocol";

export function GET() {
  const wallet = protocol.agents.eva.wallet;
  const thesisProtocol = protocol.contracts.evaThesisProtocol;

  return NextResponse.json({
    agentId: protocol.agents.eva.id,
    agentURI: `${protocol.app.siteUrl}${protocol.app.agentManifestPath}`,
    services: [{ type: "agentWallet", id: `eip155:${protocol.chain.id}:${wallet}` }],
    signers: [{ agentWallet: `eip155:${protocol.chain.id}:${wallet}` }],
    thesisProtocol: {
      contract: `eip155:${protocol.chain.id}:${thesisProtocol}`,
      mcp: `${protocol.app.siteUrl}${protocol.app.apiBasePath}/mcp`,
      localMcp: "eva-mcp stdio",
      writePolicy: "X identity plus wallet required; transaction broadcasts require explicit approval.",
    },
  });
}
