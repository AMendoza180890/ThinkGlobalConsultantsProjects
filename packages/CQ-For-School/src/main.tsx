import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { seedMockData } from "./lib/data";

seedMockData(true);

createRoot(document.getElementById("root")!).render(<App />);
