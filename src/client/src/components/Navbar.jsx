import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
    window.location.reload();
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <header className="bg-white shadow-sm">
      <div className="navbar container mx-auto px-6 py-3 bg-white justify-between">
        {/* 左側 Logo */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="btn btn-ghost text-2xl font-bold text-[#03045E]"
          >
            NTUN3SI 國安社
          </Link>

          {/* 導覽連結：文章總覽 + 活動總覽 */}
          <div className="flex gap-8 text-lg font-medium">
            <Link
              to="/articles"
              className={`transition-colors duration-200 ${
                isActive("/articles")
                  ? "text-[#03045E] font-semibold"
                  : "text-[#262626] hover:text-[#03045E]"
              }`}
            >
              文章總覽
            </Link>
            <Link
              to="/events"
              className={`transition-colors duration-200 ${
                isActive("/events")
                  ? "text-[#03045E] font-semibold"
                  : "text-[#262626] hover:text-[#03045E]"
              }`}
            >
              活動總覽
            </Link>
          </div>
        </div>

        {/* 右側 搜尋框與使用者功能 */}
        <div className="flex items-center gap-3">
          <SearchBar />

          {user ? (
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar"
              >
                <div className="w-10 rounded-full">
                  <img
                    alt="User Avatar"
                    src={
                      user.avatar || "https://i.pravatar.cc/150?u=" + user.email
                    }
                  />
                </div>
              </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content bg-white rounded-box z-[1] mt-3 w-52 p-2 shadow text-[#262626]"
              >
                <li className="menu-title">
                  <span>{user.name || user.username}</span>
                </li>
                <li>
                  <a onClick={() => navigate("/profile")}>個人檔案</a>
                </li>
                <li>
                  <a onClick={handleLogout}>登出</a>
                </li>
              </ul>
            </div>
          ) : (
            <button
              className="btn btn-outline rounded-full px-6 text-[#262626] border-gray-300 hover:border-[#03045E] hover:text-[#03045E]"
              onClick={() => navigate("/login")}
            >
              註冊 / 登入
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
