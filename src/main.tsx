import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ThemeProvider } from "@/providers/ThemeProvider.tsx";
import "./styles/main.css";
import { Router } from "./utils/Router.tsx";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <Router />
    {/* <App /> */}
  </ThemeProvider>,
);
