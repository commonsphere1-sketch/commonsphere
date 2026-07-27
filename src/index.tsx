import React from "react";
import ReactDOM from "react-dom/client";
import { AnimaProvider } from "@animaapp/playground-react-sdk";
import { ThemeProvider } from "@/contexts/ThemeContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("app")!).render(
  <AnimaProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </AnimaProvider>,
);
