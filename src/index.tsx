import ReactDOM from "react-dom/client";
import { AnimaProvider } from "@animaapp/playground-react-sdk";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfilePhotoProvider } from "@/contexts/ProfilePhotoContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { LiveDataProvider } from "@/contexts/LiveDataContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import App from "./App";
import "./index.css";

// AuthProvider must sit inside AnimaProvider — it consumes the SDK's useAuth().
// ErrorBoundary wraps everything so a render error shows a message instead of
// a blank white screen.
ReactDOM.createRoot(document.getElementById("app")!).render(
  <ErrorBoundary>
    <AnimaProvider>
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
    </AnimaProvider>
  </ErrorBoundary>,
);
