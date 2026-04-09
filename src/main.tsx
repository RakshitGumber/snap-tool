import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/providers/ThemeProvider.tsx";
import { NuqsAdapter } from "nuqs/adapters/react";
import "./styles/main.css";
import { Router } from "./utils/Router.tsx";

createRoot(document.getElementById("root")!).render(
  <NuqsAdapter>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router />
    </ThemeProvider>
  </NuqsAdapter>,
);
