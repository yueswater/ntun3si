import { useEffect, useState } from "react";
import LoadingScreen from "./LoadingScreen";

/**
 * PageTransition component
 * Shows a brief loading animation between route transitions.
 */
export default function PageTransition({ children }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return loading ? <LoadingScreen message="努力加載中..." /> : children;
}
