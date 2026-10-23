export const DEMO_MODE_STORAGE_KEY = "fiscalaura_demo_mode";
export const FAMILY_PROFILE_STORAGE_KEY = "fiscalaura_family_profile";

export const clearDemoSessionData = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(DEMO_MODE_STORAGE_KEY);
  localStorage.removeItem(FAMILY_PROFILE_STORAGE_KEY);
};
