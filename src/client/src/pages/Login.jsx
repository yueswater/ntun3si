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

  // Handle input field changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle login/register form submission
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

  // Handle Google OAuth redirect
  const handleGoogleAuth = () => {
    window.location.href = "http://localhost:5050/api/auth/google";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300 rounded-2xl p-6">
        <div className="card-body">
          <h2 className="text-2xl font-bold text-center text-neutral mb-6">
            {isRegistering ? "註冊 NTUN3SI 帳號" : "登入 NTUN3SI 帳號"}
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

            <button
              type="submit"
              className="btn btn-primary w-full rounded-xl mt-4"
              disabled={loading}
            >
              {loading ? "處理中..." : isRegistering ? "註冊" : "登入"}
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
            className="btn btn-outline w-full rounded-full flex items-center justify-center gap-2 hover:bg-gray-50"
          >
            <FcGoogle className="text-xl" />
            <span>
              {isRegistering ? "使用 Google 註冊" : "使用 Google 登入"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
