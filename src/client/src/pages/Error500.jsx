import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import error500 from "../assets/500.svg";

/**
 * Error500 component
 * Displays a "Server Down" illustration
 * and automatically redirects to the homepage after 3 seconds.
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
      <img src={error500} alt="Server Error" className="w-72 h-72 mb-6" />
      <h1 className="text-4xl font-bold mb-2 text-error">網站掛了...</h1>
      <p className="text-gray-500 mb-6">我們正在修復中，三秒後將返回首頁。</p>
    </div>
  );
}
