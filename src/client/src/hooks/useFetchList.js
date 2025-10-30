import { useEffect, useState, useCallback } from "react";
import axiosClient from "../api/axiosClient";

/**
 * Fetch a list from a REST resource (e.g., "/articles", "/events").
 * Returns { data, loading, error, refresh, setData }.
 */
export default function useFetchList(resourcePath) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(resourcePath);
      setData(res.data || []);
    } catch (err) {
      setError(err);
      console.error("useFetchList refresh error:", err);
    } finally {
      setLoading(false);
    }
  }, [resourcePath]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh, setData };
}
