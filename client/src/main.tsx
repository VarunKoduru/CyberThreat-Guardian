import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  document.title = "SecureScan - Security Scanning Tools";
  
  // Set favicon
  const favicon = document.createElement("link");
  favicon.rel = "icon";
  favicon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234361ee' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/%3E%3Cpath d='M9 12l2 2 4-4'/%3E%3C/svg%3E";
  document.head.appendChild(favicon);
  
  // Set meta description
  const metaDescription = document.createElement("meta");
  metaDescription.name = "description";
  metaDescription.content = "SecureScan - Scan URLs for phishing and executable files for malware. Keep your system secure with our advanced threat detection tools.";
  document.head.appendChild(metaDescription);
  
  createRoot(root).render(<App />);
}
