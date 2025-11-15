import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/visual-effects.css";
import "flyonui/flyonui";
import { initConnectionMonitor } from "./lib/connectionMonitor";

// Inicializar monitor de conexión para adaptar efectos visuales
initConnectionMonitor();

createRoot(document.getElementById("root")!).render(<App />);
