import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function AuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Extract the token from the URL query parameter
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    // If there is no token in the URL, redirect to login
    if (!token) {
      console.error("Token not found in URL");
      navigate("/login");
      return;
    }

    // Save token to localStorage
    localStorage.setItem("token", token);

    // Define a function to fetch the user's profile using the token
    const fetchUser = async () => {
      try {
        // Send a request to get the user's info
        const res = await axiosClient.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const user = res.data;
        localStorage.setItem("user", JSON.stringify(user));

        // Redirect based on user role
        if (user.role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (err) {
        // Handle errors when fetching user info
        navigate("/login");
      }
    };

    // Execute the user info request
    fetchUser();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h2 className="text-xl font-bold">Signing in, please wait...</h2>
      <p className="text-sm text-gray-500 mt-2">
        Verifying your account information.
      </p>
    </div>
  );
}
