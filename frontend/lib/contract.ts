import { createPublicClient, http } from "viem";
import { avalanche } from "viem/chains";
import { protocol } from "./protocol";

export const client = createPublicClient({
  chain: avalanche,
  transport: http(protocol.chain.publicRpcUrl),
});
