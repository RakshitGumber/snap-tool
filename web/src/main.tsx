import { createRoot } from "react-dom/client";
import { ToastViewport } from "@/components/ui/ToastViewport.tsx";
import { ThemeProvider } from "@/providers/ThemeProvider.tsx";
import "./styles/main.css";
import { Router } from "./pages/Router.tsx";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <>
      <Router />
      <ToastViewport />
    </>
  </ThemeProvider>,
);
