import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import DataTable from "../../components/DataTable";
import ResponsiveVerifyTag from "../../components/ResponsiveVerifyTag";
import HelpButton from "../../components/HelpButton";

export default function MemberManagement() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterVerified, setFilterVerified] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await axiosClient.get("/users");
        setMembers(res.data);
      } catch (err) {
        console.error("Failed to fetch members:", err);
        setError("無法取得會員資料，請稍後再試。");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-error mt-10 text-lg font-medium">
        {error}
      </div>
    );
  }

  // 欄位名稱
  const columns = [
    "#",
    "姓名",
    "帳號",
    "電子郵件",
    "加入日期",
    "更新日期",
    "Email 驗證",
  ];

  // 格式化資料
  const lowerSearch = search.toLowerCase();
  const filtered = members.filter((m) => {
    if (filterVerified === "verified" && !m.emailVerified) return false;
    if (filterVerified === "unverified" && m.emailVerified) return false;
    if (
      search &&
      !m.name?.toLowerCase().includes(lowerSearch) &&
      !m.username?.toLowerCase().includes(lowerSearch) &&
      !m.email?.toLowerCase().includes(lowerSearch)
    )
      return false;
    return true;
  });

  const data = filtered.map((m, i) => ({
    "#": i + 1,
    姓名: m.name || "-",
    帳號: m.username,
    電子郵件: m.email,
    加入日期: new Date(m.createdAt).toLocaleDateString(),
    更新日期: new Date(m.updatedAt).toLocaleDateString(),
    "Email 驗證": <ResponsiveVerifyTag verified={m.emailVerified} />,
  }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">會員管理</h1>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          className="input input-bordered input-sm w-full max-w-xs"
          placeholder="搜尋姓名、帳號、Email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select select-bordered select-sm"
          value={filterVerified}
          onChange={(e) => setFilterVerified(e.target.value)}
        >
          <option value="">全部狀態</option>
          <option value="verified">已驗證</option>
          <option value="unverified">未驗證</option>
        </select>
      </div>

      <DataTable columns={columns} data={data} />

      {/* 幫助按鈕 - 使用 Markdown 文件 */}
      <HelpButton
        title="會員管理使用說明"
        markdownPath="/help/member-management-help.md"
      />
    </div>
  );
}
