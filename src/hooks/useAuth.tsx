import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "student" | "teacher" | "admin";

export interface Profile {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  role: Role;
  current_streak: number;
  is_suspended: boolean;
  created_at: string;
  gender?: string | null;
  school?: string | null;
  feedback_prompt_dismissed?: boolean | null;
  feedback_prompt_snooze_until?: string | null;
  phone_verified?: boolean | null;
  wa_verify_code?: string | null;
  preferred_language?: "en" | "ur" | null;
  theme_preference?: "system" | "light" | "dark" | null;
  notification_preferences?: {
    assignment?: boolean;
    submission?: boolean;
    grade?: boolean;
  } | null;
  deactivated_at?: string | null;
  username?: string | null;
  email_verified?: boolean | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileTick, setProfileTick] = useState(0);

  // Auth state listener + initial session
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setUser(next?.user ?? null);
      if (!next) {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (!data.session) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load profile whenever user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      // Retry generously in case the auth trigger that creates the profile row
      // hasn't finished yet (common on first Google sign-in). Total ~10s.
      for (let attempt = 0; attempt < 20; attempt++) {
        const { data, error: err } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (err) {
          setError(err.message);
          setProfile(null);
          setLoading(false);
          return;
        }
        if (data) {
          setProfile(data as Profile);
          setLoading(false);
          return;
        }
        // No row yet — wait and retry.
        await new Promise((r) => setTimeout(r, 500));
      }
      if (cancelled) return;
      setProfile(null);
      setLoading(false);

    })();
    return () => {
      cancelled = true;
    };
  }, [user, profileTick]);

  const retry = useCallback(() => setProfileTick((n) => n + 1), []);
  const refreshProfile = useCallback(async () => {
    setProfileTick((n) => n + 1);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, session, profile, loading, error, retry, refreshProfile, signOut }),
    [user, session, profile, loading, error, retry, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
