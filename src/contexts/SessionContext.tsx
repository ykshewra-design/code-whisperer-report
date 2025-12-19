import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ChatMode } from "@/components/ModeSelection";

type SessionState = "idle" | "finding" | "connected" | "error";

interface SessionContextType {
  state: SessionState;
  mode: ChatMode | null;
  partnerId: string | null;
  error: string | null;
  
  // Actions
  startFinding: (mode: ChatMode) => void;
  connected: (partnerId: string) => void;
  skip: () => void;
  end: () => void;
  setError: (error: string) => void;
  clearError: () => void;
  upgradeMode: (mode: ChatMode) => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
};

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const [state, setState] = useState<SessionState>("idle");
  const [mode, setMode] = useState<ChatMode | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [error, setErrorState] = useState<string | null>(null);

  const startFinding = useCallback((selectedMode: ChatMode) => {
    setMode(selectedMode);
    setState("finding");
    setErrorState(null);
  }, []);

  const connected = useCallback((id: string) => {
    setPartnerId(id);
    setState("connected");
    setErrorState(null);
  }, []);

  const skip = useCallback(() => {
    setPartnerId(null);
    setState("finding");
  }, []);

  const end = useCallback(() => {
    setPartnerId(null);
    setMode(null);
    setState("idle");
    setErrorState(null);
  }, []);

  const setError = useCallback((err: string) => {
    setErrorState(err);
    setState("error");
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
    setState("idle");
  }, []);

  const upgradeMode = useCallback((newMode: ChatMode) => {
    setMode(newMode);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        state,
        mode,
        partnerId,
        error,
        startFinding,
        connected,
        skip,
        end,
        setError,
        clearError,
        upgradeMode,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
