"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useEffect } from "react";
import { dynamicIdentityState, type DynamicIdentityState, type DynamicThesisIdentity } from "@/lib/dynamic-identity";

export default function DynamicComposeIdentityBridge({
  onIdentity,
  onIdentityState,
}: {
  onIdentity: (identity: DynamicThesisIdentity) => void;
  onIdentityState: (state: DynamicIdentityState) => void;
}) {
  const { primaryWallet, user } = useDynamicContext();

  useEffect(() => {
    const state = dynamicIdentityState({ primaryWallet, user });
    onIdentityState(state);
    if (state.status === "ready") onIdentity(state.identity);
  }, [onIdentity, onIdentityState, primaryWallet, user]);

  return null;
}
