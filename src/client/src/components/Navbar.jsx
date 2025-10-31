import { useEffect, useState, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faXmark,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const avatarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Load user session from local storage
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Close avatar dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setIsAvatarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
    window.location.reload();
  };

  const isActive = (path) => location.pathname.startsWith(path);

  // Toggle search bar
  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (isOpen) setIsOpen(false);
  };

  // Toggle hamburger menu
  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (showSearch) setShowSearch(false);
  };

  // Toggle avatar dropdown
  const toggleAvatar = () => {
    setIsAvatarOpen((prev) => !prev);
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 w-full z-50">
      <div className="navbar container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Left: Hamburger (mobile only) + Logo + Desktop Links */}
        <div className="flex items-center gap-6">
          {/* Hamburger (visible only on mobile) */}
          <button
            className="btn btn-ghost text-[#03045E] lg:hidden"
            onClick={toggleMenu}
          >
            <FontAwesomeIcon icon={isOpen ? faXmark : faBars} size="lg" />
          </button>

          {/* Shared Logo */}
          <Link
            to="/"
            className="btn btn-ghost text-2xl font-bold text-[#03045E]"
            onClick={() => {
              setIsOpen(false);
              setShowSearch(false);
            }}
          >
            NTUN3SI 國安社
          </Link>

          {/* Desktop navigation links (next to logo) */}
          <div className="hidden lg:flex items-center gap-8 text-lg font-medium ml-4">
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

        {/* Right: Search + Avatar (shared for both desktop & mobile) */}
        <div className="flex items-center gap-4">
          {/* Search button (mobile only) */}
          <button
            className="btn btn-ghost btn-circle text-[#03045E] lg:hidden"
            onClick={toggleSearch}
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} size="lg" />
          </button>

          {/* Desktop search bar */}
          <div className="hidden lg:block">
            <SearchBar />
          </div>

          {/* Avatar / Login button */}
          {user ? (
            <div className="relative" ref={avatarRef}>
              <button
                onClick={toggleAvatar}
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
              </button>
              {isAvatarOpen && (
                <ul className="menu menu-sm absolute right-0 bg-white rounded-box mt-3 w-52 p-2 shadow text-[#262626]">
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
              )}
            </div>
          ) : (
            <button
              className="btn btn-outline rounded-full px-5 text-sm text-[#262626] border-gray-300 hover:border-[#03045E] hover:text-[#03045E]"
              onClick={() => navigate("/login")}
            >
              登入
            </button>
          )}
        </div>
      </div>

      {/* Mobile search bar (expanded below navbar) */}
      {showSearch && (
        <div className="lg:hidden bg-white shadow-inner border-t p-3">
          <div className="w-[95%] mx-auto">
            <SearchBar />
          </div>
        </div>
      )}

      {/* Mobile hamburger menu */}
      {isOpen && (
        <div className="lg:hidden bg-white shadow-md border-t">
          <div className="flex justify-around p-4 text-lg font-medium">
            <Link
              to="/articles"
              onClick={() => setIsOpen(false)}
              className={`${
                isActive("/articles")
                  ? "text-[#03045E] font-semibold"
                  : "text-[#262626]"
              }`}
            >
              文章總覽
            </Link>
            <Link
              to="/events"
              onClick={() => setIsOpen(false)}
              className={`${
                isActive("/events")
                  ? "text-[#03045E] font-semibold"
                  : "text-[#262626]"
              }`}
            >
              活動總覽
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
