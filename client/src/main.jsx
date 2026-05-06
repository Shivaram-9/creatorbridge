import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import App from "./App.jsx";
import "./index.css";

// Temporarily disabling ErrorBoundary to find the REAL runtime crash
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* <ErrorBoundary> */}
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    {/* </ErrorBoundary> */}
  </React.StrictMode>
);

// Global debug listener to catch raw errors
window.addEventListener('error', (event) => {
  console.log('--- DEBUG CRASH DETECTED ---');
  console.log('Error Message:', event.message);
  console.log('Source:', event.filename, 'Line:', event.lineno);
  console.log('Stack Trace:', event.error?.stack);
  console.log('----------------------------');
});
