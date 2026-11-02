import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applySettings, readSettings } from "./lib/theme-storage";

applySettings(readSettings());
createRoot(document.getElementById("root")!).render(<App />);
