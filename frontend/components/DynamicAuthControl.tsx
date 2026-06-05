"use client";

import { useEffect, useState, type ComponentType } from "react";

export default function DynamicAuthControl() {
  const [Widget, setWidget] = useState<ComponentType | null>(null);
  const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;

  useEffect(() => {
    if (!environmentId) return;
    let cancelled = false;
    import("@dynamic-labs/sdk-react-core")
      .then((module) => {
        if (!cancelled) setWidget(() => module.DynamicWidget as ComponentType);
      })
      .catch(() => setWidget(null));
    return () => {
      cancelled = true;
    };
  }, [environmentId]);

  if (!environmentId || !Widget) {
    return null;
  }

  return (
    <div className="dynamic-auth-control">
      <Widget />
    </div>
  );
}
