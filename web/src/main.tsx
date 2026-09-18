import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";

import { App } from "./App.tsx";
import { wordfeelIconUrl } from "./assets.ts";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing application root.");

const favicon = document.createElement("link");
favicon.rel = "icon";
favicon.type = "image/png";
favicon.href = wordfeelIconUrl;
document.head.append(favicon);

createRoot(root).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
);
