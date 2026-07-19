"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  api,
  type AuditJobRecord,
  type AuditStatus,
  type CreateAuditPayload,
} from "@/lib/api";

export type AuditPhase = "idle" | "submitting" | "polling" | "completed" | "error";

export interface AuditJobState {
  phase: AuditPhase;
  audit: AuditJobRecord | null;
  error: string | null;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_DURATION_MS = 180_000; // 3 minutes

const TERMINAL_STATUSES: AuditStatus[] = ["completed", "failed"];

export function useAuditJob() {
  const [state, setState] = useState<AuditJobState>({
    phase: "idle",
    audit: null,
    error: null,
  });

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const pollAudit = useCallback(
    async (auditId: string) => {
      try {
        const { audit } = await api.getAudit(auditId);

        if (TERMINAL_STATUSES.includes(audit.status)) {
          if (audit.status === "completed") {
            setState({ phase: "completed", audit, error: null });
          } else {
            setState({
              phase: "error",
              audit,
              error: "Audit failed. Check the backend logs for details.",
            });
          }
          return;
        }

        setState({ phase: "polling", audit, error: null });

        if (Date.now() - pollStartRef.current > MAX_POLL_DURATION_MS) {
          setState({
            phase: "error",
            audit,
            error: "Audit timed out. The pipeline is still running on the backend.",
          });
          return;
        }

        pollTimerRef.current = setTimeout(() => pollAudit(auditId), POLL_INTERVAL_MS);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch audit status.";
        setState((prev) => ({ ...prev, phase: "error", error: message }));
      }
    },
    []
  );

  const submitAudit = useCallback(
    async (payload: CreateAuditPayload) => {
      stopPolling();
      setState({ phase: "submitting", audit: null, error: null });

      try {
        const { audit } = await api.createAudit(payload);
        pollStartRef.current = Date.now();
        setState({ phase: "polling", audit, error: null });
        pollAudit(audit.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create audit.";
        setState({ phase: "error", audit: null, error: message });
      }
    },
    [pollAudit, stopPolling]
  );

  const reset = useCallback(() => {
    stopPolling();
    setState({ phase: "idle", audit: null, error: null });
  }, [stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return { ...state, submitAudit, reset };
}
