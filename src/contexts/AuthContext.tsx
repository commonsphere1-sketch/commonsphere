import { createContext, useContext, ReactNode } from "react";
import { useAuth as useSDKAuth } from "@animaapp/playground-react-sdk";

type AuthContextType = {
  user: { id: string; email: string; name: string } | null | undefined;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isPending: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: async () => {},
  isPending: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, login, logout, isPending } = useSDKAuth();
  return (
    <AuthContext.Provider value={{ user, login, logout, isPending }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
