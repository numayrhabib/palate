import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);

  const loadProfile = useCallback(async (user) => {
    if (!user) { setProfile(null); return; }
    const { data } = await supabase.from("profile_stats").select("*").eq("id", user.id).maybeSingle();
    const { data: raw } = await supabase.from("profiles").select("club_until").eq("id", user.id).maybeSingle();
    setProfile(data ? { ...data, club_until: raw?.club_until ?? null } : null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadProfile(data.session?.user).finally(() => setReady(true));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      loadProfile(s?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value = {
    ready,
    session,
    user: session?.user ?? null,
    profile,
    isAdmin: profile?.role === "admin",
    refreshProfile: () => loadProfile(session?.user),
    signInPassword: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    // Returns true when the account is ready straight away, false when the email must be confirmed first
    signUpPassword: async (email, password) => {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: "https://numayrhabib.github.io/palate/" } });
      if (error) throw error;
      return !!data.session;
    },
    sendCode: async (email) => {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) throw error;
    },
    verifyCode: async (email, token) => {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (error) throw error;
    },
    signOut: () => supabase.auth.signOut(),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
