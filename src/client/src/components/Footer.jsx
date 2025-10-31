import { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle newsletter subscription
  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      // Explicitly set backend base URL
      const apiBase =
        import.meta.env.VITE_BASE_URL?.replace(/\/$/, "") ||
        "http://localhost:5050/api";

      const res = await fetch(`${apiBase}/test/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          recipients: [email],
          subject: "感謝訂閱 NTUN3SI 國安社電子報",
          content:
            "我們已收到您的訂閱，後續將寄送最新活動與文章給您。若非本人操作，請忽略此信。",
        }),
      });

      // Handle non-JSON responses safely
      let data;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) throw new Error(data.message || "Subscription failed.");
      alert("訂閱成功，請查收確認信。");
      setEmail("");
    } catch (err) {
      alert(`訂閱失敗：${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-base-200 text-base-content px-6 md:px-16 py-10">
      {/* Main section container */}
      <div className="flex flex-nowrap overflow-x-auto justify-start md:justify-center gap-x-10 md:gap-x-16 px-2 scrollbar-none">
        {/* Service section */}
        <nav className="flex-shrink-0 space-y-2">
          <h6 className="footer-title">社團服務</h6>
          <a className="link link-hover block">活動公告</a>
          <a className="link link-hover block">投稿專區</a>
          <a className="link link-hover block">會員制度</a>
        </nav>

        {/* About section */}
        <nav className="flex-shrink-0 space-y-2">
          <h6 className="footer-title">關於我們</h6>
          <a className="link link-hover block">社團介紹</a>
          <a className="link link-hover block">聯絡我們</a>
          <a className="link link-hover block">合作夥伴</a>
        </nav>

        {/* Policy section */}
        <nav className="flex-shrink-0 space-y-2">
          <h6 className="footer-title">政策與條款</h6>
          <a className="link link-hover block">使用條款</a>
          <a className="link link-hover block">隱私政策</a>
        </nav>

        {/* Newsletter subscription section */}
        <form
          className="flex-shrink-0 sm:ml-8 space-y-2"
          onSubmit={handleSubscribe}
        >
          <h6 className="footer-title">電子報</h6>
          <label className="label">
            <span className="label-text">訂閱我們的電子報</span>
          </label>
          <fieldset className="join">
            <input
              type="email"
              placeholder="your@email.com"
              className="input input-bordered join-item rounded-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="submit"
              className="btn btn-primary join-item rounded-xl"
              disabled={loading}
            >
              {loading ? "處理中..." : "訂閱"}
            </button>
          </fieldset>
        </form>
      </div>

      {/* Footer copyright */}
      <div className="mt-10 text-center text-sm opacity-70">
        © {new Date().getFullYear()} NTUN3SI 國安社. All rights reserved.
      </div>
    </footer>
  );
}
