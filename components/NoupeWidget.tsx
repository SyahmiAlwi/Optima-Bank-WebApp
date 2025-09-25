"use client";

import { useEffect, useState } from "react";

type ConsentState = "unknown" | "granted" | "denied";

function useThirdPartyChatConsent(key = "third_party_chat") {
  const [state, setState] = useState<ConsentState>("unknown");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === "granted" || stored === "denied") setState(stored as ConsentState);
    } catch {}
  }, [key]);

  const grant = () => {
    try {
      localStorage.setItem(key, "granted");
    } catch {}
    setState("granted");
  };
  const deny = () => {
    try {
      localStorage.setItem(key, "denied");
    } catch {}
    setState("denied");
  };

  return { state, grant, deny };
}

export default function NoupeWidget({
  humanHandoffHref = "/contact",
  showOnThisPage = true,
}: {
  humanHandoffHref?: string;
  showOnThisPage?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { state, grant, deny } = useThirdPartyChatConsent();

  // Fully disable Noupe widget across the app
  return null;

  const ping = (e: string) => {
    try {
      const payload = new Blob([JSON.stringify({ e })], { type: "application/json" });
      if (navigator.sendBeacon) return navigator.sendBeacon("/api/telemetry", payload);
    } catch {}
    try {
      fetch("/api/telemetry", { method: "POST", body: JSON.stringify({ e }) });
    } catch {}
  };

  return null;
}


