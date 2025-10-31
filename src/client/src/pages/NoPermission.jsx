import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function NoPermission() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/", { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-[70vh] bg-base-100">
      <h1 className="text-5xl font-bold text-error animate-pulse">你壞壞</h1>
    </div>
  );
}
