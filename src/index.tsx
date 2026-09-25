// First, so the last refresh this browser saw is applied to the data before
// any page reads it (see lib/liveFigures.ts).
import "@/lib/liveFigures";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfilePhotoProvider } from "@/contexts/ProfilePhotoContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { LiveDataProvider } from "@/contexts/LiveDataContext";
import { WatchlistProvider } from "@/contexts/WatchlistContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import App from "./App";
import "./index.css";

// Order matters: the profile reads the signed-in account from AuthProvider,
// and the avatar and the watch list read the profile. ErrorBoundary wraps everything so a
// render error shows a message instead of a blank white screen.
ReactDOM.createRoot(document.getElementById("app")!).render(
  <ErrorBoundary>
    <AuthProvider>
      <ProfileProvider>
        <ProfilePhotoProvider>
          <WatchlistProvider>
            <LiveDataProvider>
              <ThemeProvider>
                <App />
              </ThemeProvider>
            </LiveDataProvider>
          </WatchlistProvider>
        </ProfilePhotoProvider>
      </ProfileProvider>
    </AuthProvider>
  </ErrorBoundary>,
);
