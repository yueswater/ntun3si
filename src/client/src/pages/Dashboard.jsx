// src/pages/Dashboard.jsx
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faFileAlt,
  faCalendarDays,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-neutral">管理員控制台</h1>
      <p className="text-gray-500">歡迎回來，請選擇要管理的項目。</p>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {/* 會員管理 */}
        <Link to="/admin/members">
          <div className="card bg-base-100 shadow-md hover:shadow-lg transition p-6 cursor-pointer hover:scale-105 transform">
            <FontAwesomeIcon
              icon={faUsers}
              className="text-3xl text-primary mb-3"
            />
            <h2 className="text-xl font-semibold">會員管理</h2>
            <p className="text-sm text-gray-500 mt-2">
              檢視、刪除或編輯會員資料。
            </p>
          </div>
        </Link>

        {/* 文章管理 */}
        <Link to="/admin/articles">
          <div className="card bg-base-100 shadow-md hover:shadow-lg transition p-6 cursor-pointer hover:scale-105 transform">
            <FontAwesomeIcon
              icon={faFileAlt}
              className="text-3xl text-primary mb-3"
            />
            <h2 className="text-xl font-semibold">文章管理</h2>
            <p className="text-sm text-gray-500 mt-2">
              審核、發布或刪除社團文章。
            </p>
          </div>
        </Link>

        {/* 活動管理 */}
        <Link to="/admin/events">
          <div className="card bg-base-100 shadow-md hover:shadow-lg transition p-6 cursor-pointer hover:scale-105 transform">
            <FontAwesomeIcon
              icon={faCalendarDays}
              className="text-3xl text-primary mb-3"
            />
            <h2 className="text-xl font-semibold">活動管理</h2>
            <p className="text-sm text-gray-500 mt-2">編輯與公告活動資訊。</p>
          </div>
        </Link>

        {/* 表單管理 */}
        <Link to="/admin/forms">
          <div className="card bg-base-100 shadow-md hover:shadow-lg transition p-6 cursor-pointer hover:scale-105 transform">
            <FontAwesomeIcon
              icon={faClipboardList}
              className="text-3xl text-primary mb-3"
            />
            <h2 className="text-xl font-semibold">報名表單管理</h2>
            <p className="text-sm text-gray-500 mt-2">
              建立、編輯活動報名表單。
            </p>
          </div>
        </Link>
      </div>

      {/* Statistics Section (Optional) */}
      <div className="divider mt-12">統計資訊</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-figure text-primary">
            <FontAwesomeIcon icon={faUsers} className="text-3xl" />
          </div>
          <div className="stat-title">總會員數</div>
          <div className="stat-value text-primary">--</div>
          <div className="stat-desc">查看會員管理了解詳情</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-figure text-secondary">
            <FontAwesomeIcon icon={faFileAlt} className="text-3xl" />
          </div>
          <div className="stat-title">文章數量</div>
          <div className="stat-value text-secondary">--</div>
          <div className="stat-desc">查看文章管理了解詳情</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-figure text-accent">
            <FontAwesomeIcon icon={faCalendarDays} className="text-3xl" />
          </div>
          <div className="stat-title">活動數量</div>
          <div className="stat-value text-accent">--</div>
          <div className="stat-desc">查看活動管理了解詳情</div>
        </div>
      </div>
    </div>
  );
}
