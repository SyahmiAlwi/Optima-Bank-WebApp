"use client";

import { useEffect } from "react";

export default function NoupeInline() {
  useEffect(() => {
    if (document.getElementById("noupe-embed-script")) return;
    const s = document.createElement("script");
    s.id = "noupe-embed-script";
    s.src = "https://www.noupe.com/embed/019975c14f3a726a95bf63ba53f95daa7dea.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  return null;
}



