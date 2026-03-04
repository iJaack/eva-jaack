import CuratorProfile from "./CuratorProfile";

export function generateStaticParams() {
  return [
    { address: "0x0fe61780bd5508b3C99e420662050e5560608cA4" },
  ];
}

export default function CuratorPage() {
  return <CuratorProfile />;
}
