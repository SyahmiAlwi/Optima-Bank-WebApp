"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import faq from "@/data/optimaFaq";

type Level = "home" | "section" | "answer";

const STORAGE_KEY = "optima-chatbot-open";
const BADGE_KEY = "optima-chatbot-unread";

const ChatbotWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [level, setLevel] = useState<Level>("home");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const [isPortalReady, setIsPortalReady] = useState(false);

  // Restore open state per session
  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
      if (saved === "1") setOpen(true);
      const badge = typeof window !== "undefined" ? sessionStorage.getItem(BADGE_KEY) : null;
      if (badge !== "0") setHasUnread(true);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, open ? "1" : "0");
    } catch {}
    if (!open) {
      // reset nav when closing
      setLevel("home");
      setActiveSection(null);
      setActiveQuestion(null);
    }
    if (open) {
      try {
        sessionStorage.setItem(BADGE_KEY, "0");
      } catch {}
      setHasUnread(false);
    }
  }, [open]);

  // Mount animation
  useEffect(() => {
    if (open) {
      setAnimateIn(false);
      const id = requestAnimationFrame(() => setAnimateIn(true));
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  // Ensure we can portal to document.body (avoids parent transforms affecting position)
  useEffect(() => {
    setIsPortalReady(typeof window !== "undefined");
  }, []);

  // Focus trap + ESC
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const panel = panelRef.current;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerBtnRef.current?.focus();
      }
      if (e.key === "Tab") {
        const focusables = panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    firstFocusableRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const goHome = () => {
    setLevel("home");
    setActiveSection(null);
    setActiveQuestion(null);
  };

  const onPickSection = (section: string) => {
    setActiveSection(section);
    setLevel("section");
    setActiveQuestion(null);
  };

  const onPickQuestion = (q: string) => {
    setActiveQuestion(q);
    setLevel("answer");
  };

  // Hard-enforce bottom-right placement of trigger to bypass any global CSS side effects
  useEffect(() => {
    const el = triggerBtnRef.current;
    if (!el) return;
    const apply = () => {
      el.style.position = "fixed";
      el.style.right = "24px";
      el.style.bottom = "24px";
      el.style.left = "auto";
      el.style.top = "auto";
      el.style.zIndex = "2147483647";
      el.style.pointerEvents = "auto";
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  const Bubble = ({ from, children }: { from: "bot" | "user"; children: React.ReactNode }) => (
    <div className={`flex ${from === "user" ? "justify-end" : "justify-start"} mb-3 animate-fadeIn`}>
      {from === "bot" && (
        <img
          src="/agent-avatar.jpg"
          alt="Assistant"
          className="h-6 w-6 rounded-full border border-gray-200 mr-2 self-end"
        />
      )}
      <div
        className={`${
          from === "user"
            ? "bg-gradient-to-r from-[#6a3fe3] to-[#512da8] text-white shadow-lg"
            : "bg-white text-gray-800 border border-gray-200/50 shadow-md"
        } max-w-[80%] rounded-2xl px-4 py-3 text-sm transition-all duration-200 hover:shadow-lg`}
      >
        {children}
      </div>
      {from === "user" && (
        <img
          src="/placeholder-user.jpg"
          alt="You"
          className="h-6 w-6 rounded-full border border-gray-200 ml-2 self-end"
        />
      )}
    </div>
  );

  const QuickReplies = ({ options, onClick, firstFocusIndex = 0 }:{ options: string[]; onClick: (label:string)=>void; firstFocusIndex?: number; }) => (
    <div className="flex flex-col gap-2 mt-3" role="group" aria-label="Quick replies">
      {options.map((label, i) => (
        <button
          key={label}
          ref={i === firstFocusIndex ? firstFocusableRef : undefined}
          onClick={() => onClick(label)}
          className="w-full rounded-full border border-gray-300/50 bg-white/90 px-4 py-3 text-sm font-medium whitespace-normal break-words leading-snug hover:bg-gradient-to-r hover:from-[#6a3fe3] hover:to-[#512da8] hover:text-white hover:border-transparent focus:outline-none focus:ring-2 focus:ring-[#6a3fe3]/30 transition-all duration-200 hover:scale-105 hover:shadow-md text-left"
          aria-label={`Open ${label}`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const renderHome = () => (
    <div className="space-y-3">
      <Bubble from="bot">
        <p>{faq.welcome.message}</p>
        <QuickReplies options={faq.welcome.buttons} onClick={onPickSection} />
      </Bubble>
    </div>
  );

  const renderSection = () => {
    if (!activeSection) return null;
    const sec = faq.sections[activeSection];
    return (
      <div className="space-y-3">
        <Bubble from="bot">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{sec.title}</h3>
          </div>
          <p className="mt-2 text-sm">Choose a question:</p>
          <QuickReplies options={sec.buttons} onClick={(q)=>onPickQuestion(q)} />
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={goHome}
              className="rounded-full border border-gray-300/50 bg-white/90 p-2 hover:bg-gradient-to-r hover:from-[#6a3fe3] hover:to-[#512da8] hover:text-white hover:border-transparent focus:outline-none focus:ring-2 focus:ring-[#6a3fe3]/30 transition-all duration-200 hover:scale-105"
              aria-label="Go to Home"
              title="Home"
            >
              🏠
            </button>
            <button
              onClick={() => setLevel("home")}
              className="rounded-full border border-gray-300/50 bg-white/90 p-2 hover:bg-gradient-to-r hover:from-[#6a3fe3] hover:to-[#512da8] hover:text-white hover:border-transparent focus:outline-none focus:ring-2 focus:ring-[#6a3fe3]/30 transition-all duration-200 hover:scale-105"
              aria-label="Back"
              title="Back"
            >
              ←
            </button>
          </div>
        </Bubble>
      </div>
    );
  };

  const renderAnswer = () => {
    if (!activeSection || !activeQuestion) return null;
    const sec = faq.sections[activeSection];
    const answer = sec.answers[activeQuestion];
    return (
      <div className="space-y-3">
        <Bubble from="user">
          <p className="text-sm font-medium">{activeQuestion}</p>
        </Bubble>
        <Bubble from="bot">
          <p className="text-sm leading-relaxed">{answer}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setLevel("section")}
              className="rounded-full border border-gray-300/50 bg-white/90 p-2 hover:bg-gradient-to-r hover:from-[#6a3fe3] hover:to-[#512da8] hover:text-white hover:border-transparent focus:outline-none focus:ring-2 focus:ring-[#6a3fe3]/30 transition-all duration-200 hover:scale-105 hover:shadow-md"
              aria-label="Back to questions"
              title="Back to Questions"
              ref={firstFocusableRef}
            >
              ←
            </button>
            <button
              onClick={goHome}
              className="rounded-full border border-gray-300/50 bg-white/90 p-2 hover:bg-gradient-to-r hover:from-[#6a3fe3] hover:to-[#512da8] hover:text-white hover:border-transparent focus:outline-none focus:ring-2 focus:ring-[#6a3fe3]/30 transition-all duration-200 hover:scale-105 hover:shadow-md"
              aria-label="Home"
              title="Home"
            >
              🏠
            </button>
          </div>
        </Bubble>
      </div>
    );
  };

  if (!isPortalReady) return null;

  return createPortal(
    <div>
      {/* Floating trigger - bottom-right sitewide */}
      {!open && (
      <button
        ref={triggerBtnRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="optima-chatbot-panel"
        aria-label={open ? "Close Optima Help" : "Open Optima Help"}
        className="fixed right-6 bottom-6 grid place-items-center h-14 w-14 rounded-full bg-gradient-to-br from-[#6a3fe3] to-[#2563eb] text-white shadow-2xl focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-black/10 transition-all duration-300 ease-out hover:scale-110 hover:shadow-3xl border-2 border-white/30 relative pointer-events-auto hover:from-[#5a2fd8] hover:to-[#1e40af]"
        style={{ position: "fixed", right: 24, bottom: 24, left: "auto", top: "auto", zIndex: 2147483647 }}
      >
        <span className="text-2xl leading-none font-bold">?</span>
        {/* Waving indicator */}
        <span
          className="optima-wave-hand absolute -top-2 -left-2 text-xl select-none"
          aria-hidden="true"
        >
          👋
        </span>
        {!open && hasUnread && (
          <span className="absolute -top-1 -right-1 inline-flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500"></span>
          </span>
        )}
      </button>
      )}

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          id="optima-chatbot-panel"
          ref={panelRef}
        className={`fixed right-0 bottom-0 w-[24rem] max-w-[95vw] md:w-[24rem] rounded-tl-3xl rounded-tr-3xl border border-gray-200/50 bg-white/98 backdrop-blur-md shadow-2xl transition-all duration-500 ease-out ${animateIn ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"}`}
        style={{ zIndex: 2147483647 }}
        >
          {/* Modern messaging app header */}
          <div className="relative flex items-center justify-between rounded-t-3xl px-4 py-3 bg-gradient-to-r from-[#6a3fe3] via-[#5a2fd8] to-[#4a1fc8] text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src="/agent-avatar.jpg" alt="Optima Assistant" className="h-10 w-10 rounded-full border-2 border-white/30 shadow-lg" />
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Optima AI Assistant</h3>
                <p className="text-xs text-white/90 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Online • Typing...
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                triggerBtnRef.current?.focus();
              }}
              aria-label="Close Help"
              className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/60 hover:scale-110"
              title="Close"
            >
              <span className="text-white text-xl leading-none">×</span>
            </button>
          </div>

          <div className="mt-0 max-h-[60vh] overflow-auto space-y-3 bg-gradient-to-b from-gray-50 to-gray-100/50 p-4">
            {level === "home" && renderHome()}
            {level === "section" && renderSection()}
            {level === "answer" && renderAnswer()}
          </div>

          <div className="bg-gradient-to-r from-gray-100 to-gray-50 border-t border-gray-200/50 px-4 py-2">
            <p className="text-[10px] text-gray-500 text-center">
              💡 Tip: Use Tab/Shift+Tab to navigate, and ESC to close.
            </p>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default ChatbotWidget;


