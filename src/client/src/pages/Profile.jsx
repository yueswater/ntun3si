import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import AnimatedButton from "../components/AnimatedButton";
import AppAlert from "../components/AppAlert";
import heic2any from "heic2any";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // 載入使用者資料
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await axiosClient.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data);
        setForm({
          name: res.data.name || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
        });
        setAvatarPreview(res.data.avatar || "");
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        if (err.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // 處理表單輸入
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 處理檔案選擇
  const handleFileChange = async (e) => {
    let file = e.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setAlert({ type: "error", message: "檔案大小不能超過 5MB" });
      return;
    }

    // 偵測 HEIC / HEIF
    if (
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      file.name.endsWith(".heic") ||
      file.name.endsWith(".heif")
    ) {
      try {
        const convertedBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.9,
        });

        file = new File([convertedBlob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
          type: "image/jpeg",
        });
      } catch (error) {
        console.error("HEIC 轉換失敗:", error);
        setAlert({ type: "error", message: "HEIC 檔案無法轉換" });
        return;
      }
    }

    // FileReader 預覽
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    await uploadAvatar(file);
  };

  // 上傳大頭貼
  const uploadAvatar = async (file) => {
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "avatar");

    try {
      const res = await axiosClient.post("/upload", formData);
      const avatarUrl = res.data.url;
      const token = localStorage.getItem("token");
      const updateRes = await axiosClient.put(
          "/users/me",
          { avatar: avatarUrl },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

      setUser(updateRes.data);
      setAvatarPreview(avatarUrl);
d
      // 更新 localStorage
      const storedUser = JSON.parse(localStorage.getItem("user"));
      storedUser.avatar = avatarUrl;
      localStorage.setItem("user", JSON.stringify(storedUser));

      setAlert({ type: "success", message: "大頭貼更新成功！" });
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      setAlert({ type: "error", message: "上傳失敗，請稍後重試" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 儲存個人資料
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await axiosClient.put("/users/me", {
        name: form.name,
        email: form.email,
        phone: form.phone,
      });

      setUser(res.data);

      const storedUser = JSON.parse(localStorage.getItem("user"));
      storedUser.name = res.data.name;
      storedUser.email = res.data.email;
      localStorage.setItem("user", JSON.stringify(storedUser));

      setAlert({ type: "success", message: "個人資料更新成功！" });
    } catch (err) {
      console.error("Failed to update profile:", err);
      setAlert({ type: "error", message: "更新失敗，請稍後重試" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-8 relative">
      {/* Alert */}
      {alert.message && (
        <div className="absolute top-4 right-4 z-[9999]">
          <AppAlert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert({ type: "", message: "" })}
          />
        </div>
      )}

      <div className="container mx-auto max-w-4xl px-4">
        <h1 className="text-3xl font-bold mb-8">個人檔案</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：大頭貼區域 */}
          <div className="lg:col-span-1">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body items-center text-center">
                <div className="avatar mb-4">
                  <div className="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img
                      src={
                        avatarPreview ||
                        "https://i.pravatar.cc/150?u=" + user?.email
                      }
                      alt="Avatar"
                    />
                  </div>
                </div>

                <h2 className="card-title">{user?.name || user?.username}</h2>
                <p className="text-sm text-gray-500">@{user?.username}</p>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/jpg, image/heic, image/heif, image/*"
                  className="hidden"
                />

                <AnimatedButton
                  label={uploadingAvatar ? "上傳中..." : "更換大頭貼"}
                  icon="faCamera"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                />

                <p className="text-xs text-gray-400 mt-2">
                  支援 JPG、PNG，檔案大小 ≤ 5MB
                </p>
              </div>
            </div>
          </div>

          {/* 右側：個人資料表單 */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title mb-4">基本資料</h2>

                <form onSubmit={handleSave} className="space-y-4">
                  {/* 帳號 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">帳號</span>
                    </label>
                    <input
                      type="text"
                      value={user?.username || ""}
                      className="input input-bordered"
                      disabled
                    />
                    <label className="label">
                      <span className="label-text-alt text-gray-400">
                        帳號無法修改
                      </span>
                    </label>
                  </div>

                  {/* 姓名 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">姓名</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="input input-bordered"
                      required
                    />
                  </div>

                  {/* 電子郵件 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">電子郵件</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="input input-bordered"
                      required
                    />
                  </div>

                  {/* 電話 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">電話</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="請輸入電話號碼"
                      className="input input-bordered"
                    />
                  </div>

                  <div className="divider"></div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">身份：</span>
                      <span className="ml-2 font-semibold">
                        {user?.role === "admin" ? "管理員" : "會員"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email 驗證：</span>
                      {user?.emailVerified ? (
                        <span className="ml-2 badge badge-success text-white badge-sm">
                          已驗證
                        </span>
                      ) : (
                        <span className="ml-2 badge badge-error text-white badge-sm">
                          未驗證
                        </span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">註冊日期：</span>
                      <span className="ml-2">
                        {new Date(user?.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="card-actions justify-end mt-6">
                    <AnimatedButton
                      label="返回"
                      icon="faArrowLeft"
                      variant="ghost"
                      onClick={() => navigate(-1)}
                    />
                    <AnimatedButton
                      label="儲存變更"
                      icon="faFloppyDisk"
                      variant="primary"
                      onClick={handleSave}
                      disabled={saving}
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
