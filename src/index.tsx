import ReactDOM from "react-dom/client";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfilePhotoProvider } from "@/contexts/ProfilePhotoContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { LiveDataProvider } from "@/contexts/LiveDataContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import App from "./App";
import "./index.css";

// Order matters: the profile reads the signed-in account from AuthProvider,
// and the avatar reads the profile. ErrorBoundary wraps everything so a
// render error shows a message instead of a blank white screen.
ReactDOM.createRoot(document.getElementById("app")!).render(
  <ErrorBoundary>
    <AuthProvider>
      <ProfileProvider>
        <ProfilePhotoProvider>
          <LiveDataProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </LiveDataProvider>
        </ProfilePhotoProvider>
      </ProfileProvider>
    </AuthProvider>
  </ErrorBoundary>,
);
