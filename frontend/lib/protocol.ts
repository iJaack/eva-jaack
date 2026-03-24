import protocolConfig from "../../protocol.config.json";

export const protocol = protocolConfig;

export function getApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}${protocol.app.apiBasePath}`;
  }

  return `${protocol.app.siteUrl}${protocol.app.apiBasePath}`;
}
