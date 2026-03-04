import CuratorProfile from "./CuratorProfile";

export function generateStaticParams() {
  return [
    { address: "0x0fE61780BD5508b3C99E420662050E5560608cA4" },
  ];
}

export default function CuratorPage() {
  return <CuratorProfile />;
}
