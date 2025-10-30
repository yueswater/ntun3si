import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faFileAlt,
  faCalendarDays,
  faClipboardList,
  faBars,
} from "@fortawesome/free-solid-svg-icons";

export default function Sidebar({ children }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname.startsWith(path);

  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeSidebar = () => setMobileOpen(false);

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full flex flex-col justify-between bg-base-200 shadow-lg transition-all duration-300 z-[50]
        ${collapsed ? "w-20 items-center" : "w-64"} 
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* 上半區塊 */}
        <div className="w-full px-4 py-6 flex flex-col items-center lg:items-start">
          <div className="mb-6 text-center lg:text-left w-full">
            {collapsed ? (
              <h1 className="font-bold text-[#4d4d4d] text-lg leading-tight">
                管理
                <br />
                後台
              </h1>
            ) : (
              <h1 className="font-bold text-[#4d4d4d] text-2xl">管理後台</h1>
            )}
          </div>

          {/* 導覽項目 */}
          <nav className="flex flex-col gap-3 w-full">
            {[
              { to: "/admin/members", icon: faUsers, label: "會員管理" },
              { to: "/admin/articles", icon: faFileAlt, label: "文章管理" },
              { to: "/admin/events", icon: faCalendarDays, label: "活動管理" },
              { to: "/admin/forms", icon: faClipboardList, label: "表單管理" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeSidebar}
                className={`
                  relative flex items-center ${
                    collapsed ? "justify-center" : "justify-start"
                  } gap-3 p-2 rounded-lg overflow-hidden group transition-all duration-300
                  ${isActive(item.to) ? "bg-[#03045E]" : ""}
                `}
              >
                {/* Hover 背景動畫 */}
                <span
                  className={`absolute left-0 top-0 h-full w-0 bg-[#03045E] transition-all duration-300 group-hover:w-full -z-10`}
                ></span>

                <FontAwesomeIcon
                  icon={item.icon}
                  className={`text-lg z-10 transition-all duration-300 ${
                    isActive(item.to)
                      ? "text-white"
                      : "text-[#4d4d4d] group-hover:text-white"
                  }`}
                />
                {!collapsed && (
                  <span
                    className={`relative z-10 font-medium transition-all duration-300 ${
                      isActive(item.to)
                        ? "text-white"
                        : "text-[#4d4d4d] group-hover:text-white"
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* 下半區塊 */}
        <footer
          className={`text-center text-gray-500 transition-all leading-snug mb-3 ${
            collapsed ? "text-[8.5px]" : "text-[9.5px]"
          }`}
        >
          {collapsed
            ? "© 2025 臺大國安社"
            : "© 2025 臺灣大學國家暨戰略安全研究社"}
        </footer>
      </aside>

      {/* 手機版遮罩（點擊關閉） */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[40] lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* 手機漢堡按鈕（僅在關閉時顯示） */}
      {!mobileOpen && (
        <button
          className="lg:hidden fixed top-5 left-5 z-[60] p-2 rounded-md shadow bg-white text-[#4d4d4d] hover:bg-gray-100 transition-all"
          onClick={() => setMobileOpen(true)}
        >
          <FontAwesomeIcon icon={faBars} className="text-lg" />
        </button>
      )}

      {/* 主內容區 */}
      <main
        className={`flex-1 transition-all duration-300 ${
          collapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
