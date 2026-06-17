export type DynamicWalletSource = "external" | "embedded";

export type DynamicThesisIdentity = {
  dynamicUserId: string;
  xHandle: string;
  xProfileId: string;
  walletAddress: string;
  walletSource: DynamicWalletSource;
};

export type DynamicIdentityState =
  | { status: "ready"; identity: DynamicThesisIdentity; message: string }
  | { status: "missing_wallet" | "missing_x" | "missing_user"; identity: null; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

export function stringField(value: unknown, keys: string[]): string | null {
  if (!isRecord(value)) return null;
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return null;
}

function verifiedCredentials(user: unknown): Record<string, unknown>[] {
  if (!isRecord(user)) return [];
  const credentials = user.verifiedCredentials;
  return Array.isArray(credentials) ? credentials.filter(isRecord) : [];
}

function normalizeHandle(rawHandle: string | null): string | null {
  if (!rawHandle) return null;
  const trimmed = rawHandle.trim().replace(/^https?:\/\/(x|twitter)\.com\//i, "").replace(/^@+/, "").split(/[/?#]/)[0];
  if (!/^[A-Za-z0-9_]{1,15}$/.test(trimmed)) return null;
  return `@${trimmed}`;
}

function xHandleFromUser(user: unknown): string | null {
  const socialCredential = verifiedCredentials(user).find((credential) => {
    const provider = stringField(credential, ["oauthProvider", "provider", "format", "type", "name"])?.toLowerCase() ?? "";
    return provider.includes("twitter") || provider === "x";
  });
  const rawHandle =
    stringField(socialCredential, ["username", "screenName", "handle", "oauthUsername", "publicIdentifier"]) ??
    stringField(user, ["twitterUsername", "xUsername", "username", "alias", "displayName"]);
  return normalizeHandle(rawHandle);
}

function walletSourceFromDynamic(primaryWallet: unknown, user: unknown): DynamicWalletSource {
  const walletAddress = stringField(primaryWallet, ["address"])?.toLowerCase();
  const walletCredential = verifiedCredentials(user).find((credential) => stringField(credential, ["address", "walletAddress"])?.toLowerCase() === walletAddress);
  const sourceText = [
    stringField(primaryWallet, ["connectorKey", "key", "name"]),
    stringField(walletCredential, ["walletProvider", "walletName", "format", "type"]),
    stringField(isRecord(primaryWallet) ? primaryWallet.connector : null, ["key", "name"]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /embedded|turnkey|waas|dynamic/.test(sourceText) ? "embedded" : "external";
}

export function dynamicIdentityState(input: { primaryWallet: unknown; user: unknown }): DynamicIdentityState {
  const dynamicUserId = stringField(input.user, ["userId", "id", "sessionId"]);
  if (!dynamicUserId) {
    return { status: "missing_user", identity: null, message: "Connect with Dynamic before publishing a thesis." };
  }

  const xHandle = xHandleFromUser(input.user);
  if (!xHandle) {
    return { status: "missing_x", identity: null, message: "Connect an X account in Dynamic before publishing a thesis." };
  }

  const walletAddress = stringField(input.primaryWallet, ["address"]);
  if (!walletAddress || !/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
    return { status: "missing_wallet", identity: null, message: "Connect or create an Ethereum wallet before publishing a thesis." };
  }

  return {
    status: "ready",
    identity: {
      dynamicUserId,
      xHandle,
      xProfileId: stringField(input.user, ["userId", "id"]) ?? dynamicUserId,
      walletAddress,
      walletSource: walletSourceFromDynamic(input.primaryWallet, input.user),
    },
    message: "X and wallet identity connected.",
  };
}
