// src/pages/Error500.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import maintenanceAnim from "../assets/maintenance.json";

/**
 * Error500 component
 * Displays a "site under maintenance" animation and redirects to homepage after 3 seconds.
 */
export default function Error500() {
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
        <Lottie animationData={maintenanceAnim} loop={true} />
      </div>
      <h1 className="text-4xl font-bold mb-2 text-error">網站掛了...</h1>
      <p className="text-gray-500 mb-6">我們正在修復中，三秒後將返回首頁。</p>
    </div>
  );
}
