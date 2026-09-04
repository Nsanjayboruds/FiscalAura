import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getProfile } from "@/lib/api";
import type { User } from "@supabase/supabase-js";

const IS_MOCK = import.meta.env.VITE_MOCK_SUPABASE === "true";

export function useAuth(redirectIfNoProfile = true) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (IS_MOCK) {
      // Mock mode: read session from localStorage
      const token = localStorage.getItem("mock_access_token");
      const rawUser = localStorage.getItem("mock_user");
      if (!token || !rawUser) {
        navigate("/auth");
        setLoading(false);
        return;
      }
      try {
        const mockUser = JSON.parse(rawUser);
        // Create a minimal User-like object for mock mode
        setUser({ id: mockUser.id, email: mockUser.email } as User);
        fetchProfileData();
      } catch {
        navigate("/auth");
        setLoading(false);
      }
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      // Fetch profile after auth state set
      setTimeout(() => fetchProfileData(), 0);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        setLoading(false);
        return;
      }
      setUser(session.user);
      fetchProfileData();
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfileData = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      if (redirectIfNoProfile && data && !data.onboarding_completed) {
        navigate("/onboarding");
      }
    } catch {
      // Profile fetch may fail if not yet created
    }
    setLoading(false);
  };

  return { user, profile, loading, refetchProfile: () => fetchProfileData() };
}
