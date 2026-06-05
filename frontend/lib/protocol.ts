import protocolConfig from "../../protocol.config.json";

export const protocol = protocolConfig;

export function getApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    if ((window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "3001") {
      return `${window.location.protocol}//${window.location.hostname}:3001${protocol.app.apiBasePath}`;
    }
    return `${window.location.origin}${protocol.app.apiBasePath}`;
  }

  return `${protocol.app.siteUrl}${protocol.app.apiBasePath}`;
}
