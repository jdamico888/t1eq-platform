"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  AUTH_SESSION_UPDATED_EVENT,
  getCurrentSessionTechnician,
  loginRequiresSetup,
} from "@/services/auth";

import LoginScreen from "./LoginScreen";

type AuthGateProps = {
  children: ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  function refreshAuthState() {
    const requiresSetup = loginRequiresSetup();
    const currentTechnician = getCurrentSessionTechnician();

    setIsAuthorized(requiresSetup || Boolean(currentTechnician));
    setIsReady(true);
  }

  useEffect(() => {
    refreshAuthState();

    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, refreshAuthState);

    return () => {
      window.removeEventListener(
        AUTH_SESSION_UPDATED_EVENT,
        refreshAuthState
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 text-sm font-semibold text-black/40">
        Loading...
      </div>
    );
  }

  if (!isAuthorized) {
    return <LoginScreen onLoggedIn={refreshAuthState} />;
  }

  return <>{children}</>;
}
