import { useState } from "react";
import axiosClient from "../api/axiosClient";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegistering) {
        const res = await axiosClient.post("/users/register", {
          username: form.username,
          name: form.name,
          email: form.email,
          password: form.password,
        });
        alert("註冊成功！請到信箱收信驗證。");
        setIsRegistering(false);
      } else {
        const res = await axiosClient.post("/users/login", {
          email: form.email,
          password: form.password,
        });

        const { token, user } = res.data;
        login(user, token);
        if (user.role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }
    } catch (err) {
      console.error("Login/Register Error:", err);
      setError(err.response?.data?.message || "發生錯誤，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    const backendBase = import.meta.env.VITE_BASE_URL
      ? import.meta.env.VITE_BASE_URL.replace("/api", "")
      : "http://localhost:5050";

    window.location.href = `${backendBase}/api/auth/google`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300 rounded-2xl p-6">
        <div className="card-body">
          <h2 className="text-2xl font-bold text-center text-[#03045E] mb-6">
            {isRegistering ? "註冊帳號" : "登入帳號"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <>
                <div className="form-control">
                  <label className="label font-semibold">
                    <span className="label-text">帳號</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    placeholder="請輸入帳號"
                    value={form.username}
                    onChange={handleChange}
                    className="input input-bordered rounded-xl"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label font-semibold">
                    <span className="label-text">姓名</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="請輸入姓名"
                    value={form.name}
                    onChange={handleChange}
                    className="input input-bordered rounded-xl"
                    required
                  />
                </div>
              </>
            )}

            <div className="form-control">
              <label className="label font-semibold">
                <span className="label-text">帳號或電子郵件</span>
              </label>
              <input
                type="text"
                name="email"
                placeholder="you@example.com 或 帳號"
                value={form.email}
                onChange={handleChange}
                className="input input-bordered rounded-xl"
                required
              />
            </div>

            <div className="form-control">
              <label className="label font-semibold">
                <span className="label-text">密碼</span>
              </label>
              <input
                type="password"
                name="password"
                placeholder="請輸入密碼"
                value={form.password}
                onChange={handleChange}
                className="input input-bordered rounded-xl"
                required
              />
            </div>

            {error && <p className="text-error text-sm text-center">{error}</p>}

            {/* Custom animated submit button */}
            <button
              type="submit"
              disabled={loading}
              className="relative overflow-hidden w-full rounded-full border border-[#03045E] text-[#03045E] font-semibold py-3 text-base transition-all duration-300 hover:text-white group"
            >
              <span className="absolute inset-0 bg-[#03045E] scale-x-0 origin-left transition-transform duration-300 ease-out group-hover:scale-x-100 rounded-full"></span>
              <span className="relative z-10">
                {loading ? "處理中..." : isRegistering ? "註冊" : "登入"}
              </span>
            </button>
          </form>

          <p className="text-sm text-center mt-5 text-gray-600">
            {isRegistering ? (
              <>
                已有帳號？{" "}
                <button
                  type="button"
                  className="link link-primary"
                  onClick={() => setIsRegistering(false)}
                >
                  點此登入
                </button>
              </>
            ) : (
              <>
                還沒有帳號？{" "}
                <button
                  type="button"
                  className="link link-primary"
                  onClick={() => setIsRegistering(true)}
                >
                  點此註冊
                </button>
              </>
            )}
          </p>

          <div className="divider my-5 text-sm text-gray-500">
            {isRegistering ? "或使用 Google 註冊" : "或使用 Google 登入"}
          </div>

          <button
            onClick={handleGoogleAuth}
            className="relative overflow-hidden w-full rounded-full border border-gray-400 text-gray-800 font-medium flex items-center justify-center gap-2 py-3 transition-all duration-300 hover:text-white group"
          >
            {/* Animated background layer */}
            <span className="absolute inset-0 bg-black scale-x-0 origin-left transition-transform duration-300 ease-out group-hover:scale-x-100 rounded-full"></span>

            {/* Icon + Text */}
            <span className="relative z-10 flex items-center gap-2">
              <FcGoogle className="text-xl" />
              <span>
                {isRegistering ? "使用 Google 註冊" : "使用 Google 登入"}
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
