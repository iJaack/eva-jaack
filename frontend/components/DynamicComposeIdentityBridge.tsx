"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useEffect } from "react";

export type DynamicThesisIdentity = {
  dynamicUserId: string;
  xHandle: string;
  xProfileId: string;
  walletAddress: string;
  walletSource: "external" | "embedded";
};

function stringField(value: unknown, keys: string[]): string | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return null;
}

function verifiedCredentials(user: unknown): Record<string, unknown>[] {
  if (!user || typeof user !== "object") return [];
  const credentials = (user as Record<string, unknown>).verifiedCredentials;
  return Array.isArray(credentials) ? credentials.filter((credential): credential is Record<string, unknown> => Boolean(credential && typeof credential === "object")) : [];
}

function xHandleFromUser(user: unknown): string | null {
  const socialCredential = verifiedCredentials(user).find((credential) => {
    const provider = stringField(credential, ["oauthProvider", "provider", "format", "type", "name"])?.toLowerCase() ?? "";
    return provider.includes("twitter") || provider === "x";
  });
  const rawHandle =
    stringField(socialCredential, ["username", "screenName", "handle", "oauthUsername", "publicIdentifier"]) ??
    stringField(user, ["username", "alias", "displayName", "email"]);
  if (!rawHandle) return null;
  return rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`;
}

function walletSourceFromDynamic(primaryWallet: unknown, user: unknown): DynamicThesisIdentity["walletSource"] {
  const walletAddress = stringField(primaryWallet, ["address"])?.toLowerCase();
  const walletCredential = verifiedCredentials(user).find((credential) => stringField(credential, ["address", "walletAddress"])?.toLowerCase() === walletAddress);
  const sourceText = [
    stringField(primaryWallet, ["connectorKey", "key", "name"]),
    stringField(walletCredential, ["walletProvider", "walletName", "format", "type"]),
    stringField((primaryWallet as { connector?: unknown } | null)?.connector, ["key", "name"]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /embedded|turnkey|waas|dynamic/.test(sourceText) ? "embedded" : "external";
}

export default function DynamicComposeIdentityBridge({ onIdentity }: { onIdentity: (identity: DynamicThesisIdentity) => void }) {
  const { primaryWallet, user } = useDynamicContext();

  useEffect(() => {
    const walletAddress = stringField(primaryWallet, ["address"]);
    const xHandle = xHandleFromUser(user);
    const dynamicUserId = stringField(user, ["userId", "id", "sessionId"]);
    if (!walletAddress || !xHandle || !dynamicUserId) return;
    onIdentity({
      dynamicUserId,
      xHandle,
      xProfileId: stringField(user, ["userId", "id"]) ?? dynamicUserId,
      walletAddress,
      walletSource: walletSourceFromDynamic(primaryWallet, user),
    });
  }, [onIdentity, primaryWallet, user]);

  return null;
}
