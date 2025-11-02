import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import error404 from "../assets/404.svg";

/**
 * Error404 component
 * Displays a "Forbidden / Not Found" illustration
 * and automatically redirects to the homepage after 3 seconds.
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
      <img src={error404} alt="404 Not Found" className="w-72 h-72 mb-6" />
      <h1 className="text-4xl font-bold mb-2 text-warning">你不可以進來</h1>
      <p className="text-gray-500 mb-6">
        這個頁面不存在或沒有權限。三秒後將返回首頁。
      </p>
    </div>
  );
}
