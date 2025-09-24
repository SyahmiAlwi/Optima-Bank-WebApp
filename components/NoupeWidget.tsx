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

  if (!showOnThisPage) return null;

  const ping = (e: string) => {
    try {
      const payload = new Blob([JSON.stringify({ e })], { type: "application/json" });
      if (navigator.sendBeacon) return navigator.sendBeacon("/api/telemetry", payload);
    } catch {}
    try {
      fetch("/api/telemetry", { method: "POST", body: JSON.stringify({ e }) });
    } catch {}
  };

  return (
    <>
      <button
        aria-label="Open Optima FAQ Chat"
        onClick={() => { setOpen(true); ping("noupe_open"); }}
        className="fixed bottom-5 right-5 z-40 rounded-full shadow-lg bg-black text-white px-5 py-3 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
      >
        Chat with us
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/30"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className={`${state === "granted" ? "fixed bottom-20 right-5 z-50 w-[380px] max-w-[90vw] h-[580px] rounded-2xl overflow-hidden" : "fixed bottom-20 right-5 z-50 w-[380px] max-w-[90vw] h-[580px] rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden"}`}
        >
          {state !== "granted" && (
            <header className="px-3 py-2 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-[#0b0b0b]">
              <div className="text-sm font-semibold">Optima FAQ Bot</div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                ✕
              </button>
            </header>
          )}

          <main className="flex-1 min-h-0">
            {state === "unknown" && (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <h3 className="text-base font-semibold mb-2">Enable third-party chat?</h3>
                <p className="text-sm text-gray-600">
                  We use a third-party provider to power our public FAQ chatbot. Your chat may be processed by that provider.
                </p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => { grant(); ping("noupe_consent"); }}
                    className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90"
                  >
                    I agree
                  </button>
                  <button
                    onClick={deny}
                    className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
                  >
                    No thanks
                  </button>
                </div>
                <a
                  href={humanHandoffHref}
                  className="mt-4 text-sm underline text-gray-700 hover:text-black"
                >
                  Talk to a human instead
                </a>
              </div>
            )}

            {state === "denied" && (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <p className="text-sm text-gray-700">
                  Third-party chat is disabled. You can still reach us below.
                </p>
                <a
                  href={humanHandoffHref}
                  className="mt-3 px-4 py-2 rounded-xl bg-black text-white hover:opacity-90"
                >
                  Contact Support
                </a>
              </div>
            )}

            {state === "granted" && open && (
              <iframe
                src="/chatbot-host.html"
                title="Optima FAQ Bot (Sandbox)"
                sandbox="allow-scripts allow-same-origin"
                referrerPolicy="strict-origin-when-cross-origin"
                className="block w-full h-full border-0 bg-white dark:bg-[#0b0b0b]"
              />
            )}
          </main>
        </div>
      )}
    </>
  );
}


