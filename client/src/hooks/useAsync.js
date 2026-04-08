import { useState, useCallback } from "react";

export function useAsync(fn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fn(...args);
        return result;
      } catch (err) {
        setError(err.message ?? "Error desconocido");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fn]
  );

  return { execute, loading, error };
}
