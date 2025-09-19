"use client";

import { useEffect, useRef, useState } from "react";
import { MeshGradient } from "@paper-design/shaders-react";

type Props = { children: React.ReactNode };

export default function ShaderBackground({ children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onEnter = () => setIsActive(true);
    const onLeave = () => setIsActive(false);
    container.addEventListener("mouseenter", onEnter);
    container.addEventListener("mouseleave", onLeave);
    return () => {
      container.removeEventListener("mouseenter", onEnter);
      container.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden">
      <svg className="absolute inset-0 w-0 h-0">
        <defs>
          <filter id="gooey-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="gooey" />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>
      <MeshGradient
        className="absolute inset-0 h-full w-full"
        colors={["#000000", "#8b5cf6", "#ffffff", "#1e1b4b", "#4c1d95"]}
        speed={isActive ? 0.5 : 0.25}
      />
      <MeshGradient
        className="absolute inset-0 h-full w-full opacity-60"
        colors={["#000000", "#ffffff", "#8b5cf6", "#000000"]}
        speed={isActive ? 0.35 : 0.2}
        wireframe="true"
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}


