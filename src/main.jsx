import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MantineProvider, createTheme } from "@mantine/core";
import "@mantine/core/styles.css";
import App from "./App";
import "./index.css";

const theme = createTheme({
  fontFamily: "Inter, Arial, Helvetica, sans-serif",
  headings: {
    fontFamily: "Inter, Arial, Helvetica, sans-serif",
    fontWeight: "800",
  },
  primaryColor: "cyan",
  defaultRadius: "lg",
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>,
);
