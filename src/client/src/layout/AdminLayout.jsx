import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import MemberManagement from "../pages/admin/MemberManagement";
import ArticleManagement from "../pages/admin/ArticleManagement";
import EventManagement from "../pages/admin/EventManagement";
import FormManagement from "../pages/admin/FormManagement";

export default function AdminLayout() {
  const [activeTab, setActiveTab] = useState("members");
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "ntun3si-dashboard");
    return () => {
      document.documentElement.setAttribute("data-theme", "ntun3si-ocean");
    };
  }, []);

  const isNestedRoute =
    location.pathname !== "/admin" && location.pathname !== "/admin/dashboard";

  const renderContent = () => {
    switch (activeTab) {
      case "members":
        return <MemberManagement />;
      case "articles":
        return <ArticleManagement />;
      case "events":
        return <EventManagement />;
      case "forms":
        return <FormManagement />;
      default:
        return <MemberManagement />;
    }
  };

  return (
    <div className="flex min-h-screen bg-base-200">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="p-6 mt-[72px]">
          {isNestedRoute ? <Outlet /> : renderContent()}
        </div>
      </div>
    </div>
  );
}
