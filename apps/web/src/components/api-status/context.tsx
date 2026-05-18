"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getApiBaseUrl,
  readHealthResponse,
} from "@/components/claude-playground/api";
import type { HealthResponse } from "@/components/claude-playground/types";

export type ApiStatusState = "idle" | "checking" | "online" | "offline";

interface ApiStatusContextValue {
  health: HealthResponse | null;
  status: ApiStatusState;
  lastChecked: Date | null;
  check: () => Promise<void>;
}

const ApiStatusContext = createContext<ApiStatusContextValue>({
  health: null,
  status: "idle",
  lastChecked: null,
  check: async () => {},
});

export function ApiStatusProvider({ children }: { children: React.ReactNode }) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [status, setStatus] = useState<ApiStatusState>("idle");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const check = useCallback(async () => {
    setStatus("checking");

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/health`, {
        signal: AbortSignal.timeout(8_000),
      });

      if (!res.ok) throw new Error("Non-OK response");

      const data = await readHealthResponse(res);

      setHealth(data);

      setStatus("online");
    } catch {
      setHealth(null);

      setStatus("offline");
    } finally {
      setLastChecked(new Date());
    }
  }, []);

  // Run immediately on mount, then poll every 30 s
  useEffect(() => {
    void Promise.resolve().then(() => check());

    const id = setInterval(() => {
      void check();
    }, 30_000);

    return () => {
      clearInterval(id);
    };
  }, [check]);

  return (
    <ApiStatusContext.Provider value={{ health, status, lastChecked, check }}>
      {children}
    </ApiStatusContext.Provider>
  );
}

export function useApiStatus() {
  return useContext(ApiStatusContext);
}
