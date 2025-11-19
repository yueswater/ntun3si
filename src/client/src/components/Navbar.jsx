import { useEffect, useState, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faXmark,
  faMagnifyingGlass,
  faRightToBracket,
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

  const isAdmin = location.pathname.startsWith("/admin");
  const isLoginPage = location.pathname.startsWith("/login");
  const isHomePage = location.pathname === "/";

  // Header layout classes
  const headerClass =
    "bg-white shadow-sm fixed top-0 z-50 " +
    (isAdmin
      ? "left-0 w-full lg:left-64 lg:w-[calc(100%-16rem)]"
      : "left-0 w-full");

  // Load user data from localStorage
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

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
    window.location.reload();
  };

  // Highlight active route
  const isActive = (path) => location.pathname.startsWith(path);

  // Toggle mobile search bar
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
    <header className={headerClass}>
      <div className="navbar container mx-auto px-4 py-3 flex items-center justify-between lg:justify-between relative">
        {/* Left section: Hamburger + Logo + Navigation links */}
        <div className="flex items-center gap-6">
          {/* Mobile hamburger icon */}
          <button
            className="btn btn-ghost text-[#03045E] lg:hidden"
            onClick={toggleMenu}
          >
            <FontAwesomeIcon icon={isOpen ? faXmark : faBars} size="lg" />
          </button>

          {/* Logo area with image + text */}
          <Link
            to="/"
            className={`flex items-center gap-2 text-2xl font-bold text-[#03045E] absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 transition-all duration-200 ${
              isHomePage ? "-ml-2" : ""
            } hover:bg-transparent focus:bg-transparent active:bg-transparent`}
            onClick={() => {
              setIsOpen(false);
              setShowSearch(false);
            }}
          >
            <img
              src="/ntun3si.svg"
              alt="NTUN3SI Logo"
              className="w-8 h-8 object-contain"
            />
            <span>臺大國安社</span>
          </Link>

          {/* Desktop navigation links */}
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

        {/* Right section: Search bar + Login/Avatar */}
        <div className="flex items-center gap-4">
          {/* Desktop search bar */}
          {!isLoginPage && (
            <div className="hidden lg:block">
              <SearchBar />
            </div>
          )}

          {/* Avatar or Login button */}
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
              onClick={() => navigate("/login")}
              className="relative overflow-hidden border border-gray-300 text-[#03045E] font-semibold rounded-full px-6 py-3 text-base transition-all duration-300 hover:text-white hover:border-[#03045E] group"
            >
              <span className="absolute inset-0 bg-[#03045E] scale-x-0 origin-left transition-transform duration-300 ease-out group-hover:scale-x-100 rounded-full"></span>
              <span className="relative z-10 hidden sm:inline">註冊／登入</span>
              <span className="relative z-10 sm:hidden">
                <FontAwesomeIcon icon={faRightToBracket} size="lg" />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile search bar */}
      {showSearch && !isLoginPage && (
        <div className="lg:hidden bg-white shadow-inner border-t p-3">
          <div className="w-[95%] mx-auto">
            <SearchBar />
          </div>
        </div>
      )}

      {/* Mobile hamburger menu */}
      {isOpen && (
      <div className="lg:hidden bg-white shadow-md border-t p-4 text-lg font-medium flex flex-col gap-4">

        {/* 第一排：文章 / 活動（左右排列） */}
        <div className="flex justify-around">
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

        {/* 第二排：搜尋欄（整行） */}
        {!isLoginPage && (
          <div className="w-full">
            <SearchBar />
          </div>
        )}
      </div>
    )}
    </header>
  );
}
