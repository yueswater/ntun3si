// src/pages/Error404.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import error404Anim from "../assets/error404.json";

/**
 * Error404 component
 * Displays a 404 robot animation and redirects to homepage after 3 seconds.
 */
export default function Error404() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 text-center">
      <div className="w-80">
        <Lottie animationData={error404Anim} loop={true} />
      </div>
      <h1 className="text-4xl font-bold mb-2 text-warning">你不可以進來</h1>
      <p className="text-gray-500 mb-6">
        這個頁面不存在或沒有權限。三秒後將返回首頁。
      </p>
    </div>
  );
}
