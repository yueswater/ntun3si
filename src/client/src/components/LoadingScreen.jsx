import Lottie from "lottie-react";
import loadingAnim from "../assets/loading_animation.json";

/**
 * LoadingScreen component
 * Displays a centered loading animation with optional text.
 */
export default function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 text-center">
      <div className="w-60 mb-4">
        <Lottie animationData={loadingAnim} loop={true} />
      </div>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}
