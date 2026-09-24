import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthError, Session } from "@supabase/supabase-js";
import {
  supabase,
  initialAuthRedirect,
  siteUrl,
  type OAuthProvider,
} from "@/lib/supabase";
import { deleteOwnAccount } from "@/lib/supabaseData";
import { syncPinsFor } from "@/lib/pins";
import { AuthModal, type AuthMode, type AuthPrefill } from "@/components/AuthModal";

/**
 * Accounts, on Supabase Auth.
 *
 * `user` is undefined while the stored session is being read, null when
 * nobody is signed in, and the signed-in person otherwise. When the site is
 * built without Supabase keys it is always null and every action reports that
 * accounts are unavailable, so the rest of the app runs as a guest.
 *
 * `login()` opens the sign-in dialog, which this provider renders, so any
 * page can ask for it without knowing where it lives.
 */

export type AppUser = {
  id: string;
  email: string;
  name: string;
  /** An email change waiting for confirmation, if there is one. */
  pendingEmail?: string;
};

export type AuthResult =
  | { ok: true; message?: string }
  | { ok: false; message: string; code?: string };

type AuthContextType = {
  user: AppUser | null | undefined;
  session: Session | null;
  isPending: boolean;
  isConfigured: boolean;
  /** True after arriving from a password-reset link, until a new one is set. */
  recovery: boolean;
  login: () => Promise<void>;
  openAuth: (mode?: AuthMode, prefill?: AuthPrefill) => void;
  logout: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    profile?: { displayName?: string; username?: string },
  ) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  sendMagicLink: (email: string) => Promise<AuthResult>;
  signInWithProvider: (provider: OAuthProvider) => Promise<AuthResult>;
  requestReauthentication: () => Promise<AuthResult>;
  updatePassword: (password: string, nonce?: string) => Promise<AuthResult>;
  updateEmail: (email: string) => Promise<AuthResult>;
  signOutEverywhere: () => Promise<AuthResult>;
  deleteAccount: () => Promise<AuthResult>;
};

const UNAVAILABLE: AuthResult = {
  ok: false,
  message: "Accounts are not available on this site yet.",
};
const unavailable = async () => UNAVAILABLE;

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isPending: false,
  isConfigured: false,
  recovery: false,
  login: async () => {},
  openAuth: () => {},
  logout: async () => {},
  signIn: unavailable,
  signUp: unavailable,
  resendConfirmation: unavailable,
  sendPasswordReset: unavailable,
  sendMagicLink: unavailable,
  signInWithProvider: unavailable,
  requestReauthentication: unavailable,
  updatePassword: unavailable,
  updateEmail: unavailable,
  signOutEverywhere: unavailable,
  deleteAccount: unavailable,
});

/** Plain-language messages for the errors people actually meet. */
function explain(error: AuthError): AuthResult {
  const byCode: Record<string, string> = {
    invalid_credentials: "That email and password do not match an account.",
    email_not_confirmed: "Confirm your email address first. The link is in your inbox.",
    weak_password: "Choose a stronger password: at least 10 characters, with letters and numbers.",
    same_password: "That is your current password. Choose a new one.",
    over_email_send_rate_limit: "Too many emails have been sent. Wait a minute and try again.",
    over_request_rate_limit: "Too many attempts. Wait a few minutes and try again.",
    signup_disabled: "New accounts are closed at the moment.",
    email_address_invalid: "That email address cannot be used.",
    reauthentication_needed: "For your security, confirm it is you before changing your password.",
    reauthentication_not_valid: "That code is wrong or has expired. Request a new one.",
    session_not_found: "Your session has ended. Sign in again.",
    otp_expired: "That link or code has expired. Request a new one.",
    user_banned: "This account has been suspended.",
  };
  const code = error.code ?? "";
  return { ok: false, code, message: byCode[code] ?? error.message };
}

function toUser(session: Session | null): AppUser | null {
  const u = session?.user;
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const pick = (k: string) => (typeof meta[k] === "string" ? (meta[k] as string) : "");
  const email = u.email ?? "";
  return {
    id: u.id,
    email,
    name: pick("display_name") || pick("full_name") || pick("name") || email.split("@")[0],
    pendingEmail: u.new_email || undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(!supabase);
  const [recovery, setRecovery] = useState(initialAuthRedirect.type === "recovery");
  const [dialog, setDialog] = useState<{ mode: AuthMode; prefill?: AuthPrefill } | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let live = true;
    // onAuthStateChange also reports the stored session (INITIAL_SESSION), but
    // reading it directly as well means the header is right on first paint.
    supabase.auth.getSession().then(({ data }) => {
      if (!live) return;
      setSession(data.session);
      setLoaded(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setLoaded(true);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_IN" || event === "USER_UPDATED") setDialog(null);
    });
    return () => {
      live = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const uid = session?.user.id ?? null;
  // Pins follow the account. Kept out of onAuthStateChange: a Supabase call
  // inside that callback can deadlock the client's own lock.
  useEffect(() => {
    if (!loaded) return;
    void syncPinsFor(uid);
  }, [uid, loaded]);

  const openAuth = useCallback((mode: AuthMode = "signin", prefill?: AuthPrefill) => {
    setDialog({ mode, prefill });
  }, []);

  const value = useMemo<AuthContextType>(() => {
    const user = loaded ? toUser(session) : undefined;
    if (!supabase) {
      return {
        user: null,
        session: null,
        isPending: false,
        isConfigured: false,
        recovery: false,
        login: async () => openAuth("signin"),
        openAuth,
        logout: async () => {},
        signIn: unavailable,
        signUp: unavailable,
        resendConfirmation: unavailable,
        sendPasswordReset: unavailable,
        sendMagicLink: unavailable,
        signInWithProvider: unavailable,
        requestReauthentication: unavailable,
        updatePassword: unavailable,
        updateEmail: unavailable,
        signOutEverywhere: unavailable,
        deleteAccount: unavailable,
      };
    }
    const sb = supabase;
    const callback = siteUrl("/auth/callback");
    return {
      user,
      session,
      isPending: !loaded,
      isConfigured: true,
      recovery,
      login: async () => openAuth("signin"),
      openAuth,
      logout: async () => {
        // This device only. "Sign out everywhere" is in Settings.
        await sb.auth.signOut({ scope: "local" });
      },
      signIn: async (email, password) => {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        return error ? explain(error) : { ok: true };
      },
      signUp: async (email, password, profile) => {
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callback,
            // Display only. The database trims these and never uses them to
            // decide what anyone may do.
            data: {
              display_name: profile?.displayName || undefined,
              username: profile?.username || undefined,
            },
          },
        });
        if (error) return explain(error);
        if (data.session) return { ok: true, message: "Your account is ready." };
        // Supabase answers the same way for an address that already has an
        // account, so nobody can use this form to learn who is registered.
        return {
          ok: true,
          message: `If ${email} is new here, a confirmation link is on its way. Open it to finish creating your account. Already registered? Sign in, or reset your password.`,
        };
      },
      resendConfirmation: async (email) => {
        const { error } = await sb.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: callback },
        });
        return error ? explain(error) : { ok: true, message: `A new confirmation link was sent to ${email}.` };
      },
      sendPasswordReset: async (email) => {
        const { error } = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: siteUrl("/auth/reset"),
        });
        if (error && error.code !== "user_not_found") return explain(error);
        return {
          ok: true,
          message: `If ${email} has an account, a link to choose a new password is on its way.`,
        };
      },
      sendMagicLink: async (email) => {
        const { error } = await sb.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: callback, shouldCreateUser: true },
        });
        return error ? explain(error) : { ok: true, message: `A sign-in link was sent to ${email}.` };
      },
      signInWithProvider: async (provider) => {
        const { error } = await sb.auth.signInWithOAuth({
          provider,
          options: { redirectTo: callback },
        });
        return error ? explain(error) : { ok: true };
      },
      requestReauthentication: async () => {
        const { error } = await sb.auth.reauthenticate();
        return error
          ? explain(error)
          : { ok: true, message: `A confirmation code was sent to ${user?.email ?? "your email"}.` };
      },
      updatePassword: async (password, nonce) => {
        const { error } = await sb.auth.updateUser(nonce ? { password, nonce } : { password });
        if (error) return explain(error);
        setRecovery(false);
        return { ok: true, message: "Your password has been changed." };
      },
      updateEmail: async (email) => {
        const { error } = await sb.auth.updateUser({ email }, { emailRedirectTo: callback });
        return error
          ? explain(error)
          : {
              ok: true,
              message: `Confirm the change from the links sent to your current address and to ${email}. Until then your email stays as it is.`,
            };
      },
      signOutEverywhere: async () => {
        const { error } = await sb.auth.signOut({ scope: "global" });
        return error ? explain(error) : { ok: true };
      },
      deleteAccount: async () => {
        const result = await deleteOwnAccount();
        if (!result.ok) return result;
        // The access token outlives the account until it expires, so it is
        // dropped from this browser now rather than left to lapse.
        await sb.auth.signOut({ scope: "local" });
        return { ok: true, message: "Your account and everything in it have been deleted." };
      },
    };
  }, [session, loaded, recovery, openAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {dialog && (
        <AuthModal
          key={dialog.mode + (dialog.prefill?.email ?? "")}
          initialMode={dialog.mode}
          prefill={dialog.prefill}
          onClose={() => setDialog(null)}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
