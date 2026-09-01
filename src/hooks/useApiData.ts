import { useEffect, useState } from "react";
import { apiGet } from "../api/client";

export function useApiData<T>(path: string, params?: Record<string, string | undefined>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiGet<T>(path, params)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };

  }, [path, JSON.stringify(params)]);

  return { data, loading, error };
}
