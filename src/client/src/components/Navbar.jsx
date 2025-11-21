import { useEffect, useState, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faXmark,
  faMagnifyingGlass,
  faRightToBracket,
  faLanguage,
} from "@fortawesome/free-solid-svg-icons";
import SearchBar from "./SearchBar";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const avatarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const isAdmin = location.pathname.startsWith("/admin");
  const isLoginPage = location.pathname.startsWith("/login");
  const isHomePage = location.pathname === "/";

  // 切換語言
  const changeLang = (lang) => {
    i18n.changeLanguage(lang);
  };

  const headerClass =
    "bg-white shadow-sm fixed top-0 z-50 " +
    (isAdmin
      ? "left-0 w-full lg:left-64 lg:w-[calc(100%-16rem)]"
      : "left-0 w-full");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const updateUser = () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    };

    window.addEventListener("auth-updated", updateUser);
    return () => window.removeEventListener("auth-updated", updateUser);
  }, []);

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

    window.dispatchEvent(new Event("auth-updated"));
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (isOpen) setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (showSearch) setShowSearch(false);
  };

  const toggleAvatar = () => {
    setIsAvatarOpen((prev) => !prev);
  };

  return (
    <header className={headerClass}>
      <div className="navbar container mx-auto px-4 py-3 flex items-center justify-between lg:justify-between relative">
        {/* Left section: Hamburger + Logo + Navigation links */}
        <div className="flex items-center gap-6">
          <button
            className="btn btn-ghost text-[#03045E] lg:hidden"
            onClick={toggleMenu}
          >
            <FontAwesomeIcon icon={isOpen ? faXmark : faBars} size="lg" />
          </button>

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
            <span>{t("navbar.clubName")}</span>
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
              {t("navbar.articles")}
            </Link>

            <Link
              to="/events"
              className={`transition-colors duration-200 ${
                isActive("/events")
                  ? "text-[#03045E] font-semibold"
                  : "text-[#262626] hover:text-[#03045E]"
              }`}
            >
              {t("navbar.events")}
            </Link>

            {/* 語言切換 toggle */}
            <button
              onClick={() => changeLang(i18n.language === "zh" ? "en" : "zh")}
              className="btn btn-ghost"
            >
              <FontAwesomeIcon icon={faLanguage} className="text-[#03045E]" />
            </button>
          </div>
        </div>

        {/* Right section: Search bar + Login/Avatar */}
        <div className="flex items-center gap-4">
          {!isLoginPage && (
            <div className="hidden lg:block">
              <SearchBar />
            </div>
          )}

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
                    <a onClick={() => navigate("/profile")}>
                      {t("navbar.profile")}
                    </a>
                  </li>
                  <li>
                    <a onClick={handleLogout}>{t("navbar.logout")}</a>
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
              <span className="relative z-10 hidden sm:inline">
                {t("navbar.login")}
              </span>
              <span className="relative z-10 sm:hidden">
                <FontAwesomeIcon icon={faRightToBracket} size="lg" />
              </span>
            </button>
          )}
        </div>
      </div>

      {showSearch && !isLoginPage && (
        <div className="lg:hidden bg-white shadow-inner border-t p-3">
          <div className="w-[95%] mx-auto">
            <SearchBar />
          </div>
        </div>
      )}

      {isOpen && (
        <div className="lg:hidden bg-white shadow-md border-t p-4 text-lg font-medium flex flex-col gap-4">
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
              {t("navbar.articles")}
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
              {t("navbar.events")}
            </Link>
          </div>

          {/* 手機版語言切換 */}
          <div className="flex justify-center gap-4 mt-2">
            <button onClick={() => changeLang("zh")}>中文</button>
            <button onClick={() => changeLang("en")}>EN</button>
          </div>

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
