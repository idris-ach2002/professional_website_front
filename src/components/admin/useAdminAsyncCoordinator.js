import { useCallback, useEffect, useRef } from "react";
import {
  isAbortError,
  isAuthRequiredError,
  isConcurrencyConflictError,
} from "../../services/authApi";

/**
 * Admin async contract:
 * - loading reflects the number of in-flight actions, never a single boolean race;
 * - "latest" lanes abort/ignore obsolete reads;
 * - every controller is aborted on unmount;
 * - concurrency conflicts are surfaced distinctly from generic failures.
 */
export default function useAdminAsyncCoordinator({
  setLoading,
  setMessage,
  setError,
  setAuthStatus,
}) {
  const pendingRef = useRef(0);
  const disposedRef = useRef(false);
  const lanesRef = useRef(new Map());
  const generationRef = useRef(new Map());
  const mutationTailRef = useRef(Promise.resolve());

  const begin = useCallback(() => {
    if (disposedRef.current) return false;
    pendingRef.current += 1;
    setLoading(true);
    return true;
  }, [setLoading]);

  const end = useCallback(() => {
    pendingRef.current = Math.max(0, pendingRef.current - 1);
    if (!disposedRef.current) setLoading(pendingRef.current > 0);
  }, [setLoading]);

  const reportError = useCallback((error) => {
    if (disposedRef.current || isAbortError(error)) return;
    if (isAuthRequiredError(error)) {
      setAuthStatus("login");
      return;
    }
    if (isConcurrencyConflictError(error)) {
      setError("Modification concurrente détectée : recharge les données avant de réessayer.");
      return;
    }
    setError(error?.message ?? "Une erreur est survenue.");
  }, [setAuthStatus, setError]);

  const runAction = useCallback(async (action, successMessage) => {
    if (!begin()) return null;
    setError(null);
    setMessage(null);
    try {
      const result = await action({ signal: undefined });
      if (successMessage && !disposedRef.current) setMessage(successMessage);
      return result;
    } catch (error) {
      reportError(error);
      return null;
    } finally {
      end();
    }
  }, [begin, end, reportError, setError, setMessage]);

  const runLatest = useCallback(async (lane, action, successMessage) => {
    if (disposedRef.current) return null;
    lanesRef.current.get(lane)?.abort();
    const controller = new AbortController();
    lanesRef.current.set(lane, controller);
    const generation = (generationRef.current.get(lane) ?? 0) + 1;
    generationRef.current.set(lane, generation);

    const isCurrent = () => (
      !disposedRef.current
      && !controller.signal.aborted
      && generationRef.current.get(lane) === generation
    );
    const commit = (mutation) => {
      if (!isCurrent()) return false;
      mutation();
      return true;
    };

    if (!begin()) return null;
    setError(null);
    if (successMessage) setMessage(null);
    try {
      const result = await action({ signal: controller.signal, isCurrent, commit });
      if (!isCurrent()) return null;
      if (successMessage) setMessage(successMessage);
      return result;
    } catch (error) {
      if (!isAbortError(error) && isCurrent()) reportError(error);
      return null;
    } finally {
      if (lanesRef.current.get(lane) === controller) lanesRef.current.delete(lane);
      end();
    }
  }, [begin, end, reportError, setError, setMessage]);

  const runMutation = useCallback((action, successMessage) => {
    const execute = () => disposedRef.current ? null : runAction(action, successMessage);
    const queued = mutationTailRef.current.then(execute, execute);
    mutationTailRef.current = queued.then(() => undefined, () => undefined);
    return queued;
  }, [runAction]);

  useEffect(() => () => {
    disposedRef.current = true;
    for (const controller of lanesRef.current.values()) controller.abort();
    lanesRef.current.clear();
  }, []);

  return { runAction, runLatest, runMutation };
}
