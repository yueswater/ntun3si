import { useState } from "react";
import {
  faInstagram,
  faFacebookF,
  faLine,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle newsletter subscription
  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      const apiBase =
        import.meta.env.VITE_BASE_URL?.replace(/\/$/, "") ||
        "http://localhost:5050/api";

      const res = await fetch(`${apiBase}/mail/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

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
      {/* ====== Main navigation area ====== */}
      <div className="flex flex-wrap justify-center text-center md:justify-center md:text-left md:flex-nowrap md:gap-x-16 gap-x-10 gap-y-8 px-2">
        {/* Services section */}
        <nav className="space-y-2">
          <h6 className="footer-title">社團服務</h6>
          <a className="link link-hover block">活動公告</a>
          <a className="link link-hover block">投稿專區</a>
          <a className="link link-hover block">會員制度</a>
        </nav>

        {/* About section */}
        <nav className="space-y-2">
          <h6 className="footer-title">關於我們</h6>
          <a className="link link-hover block">社團介紹</a>
          <a className="link link-hover block">聯絡我們</a>
          <a className="link link-hover block">合作夥伴</a>
        </nav>

        {/* Policy section */}
        <nav className="space-y-2">
          <h6 className="footer-title">政策與條款</h6>
          <a className="link link-hover block">使用條款</a>
          <a className="link link-hover block">隱私政策</a>
        </nav>

        {/* Newsletter subscription (desktop only) */}
        <form className="hidden md:block space-y-2" onSubmit={handleSubscribe}>
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

      {/* ====== Newsletter (mobile only) ====== */}
      <form
        className="mt-8 block md:hidden text-center space-y-2"
        onSubmit={handleSubscribe}
      >
        <h6 className="footer-title">電子報</h6>
        <label className="label justify-center">
          <span className="label-text">訂閱我們的電子報</span>
        </label>
        <fieldset className="join justify-center">
          <input
            type="email"
            placeholder="your@email.com"
            className="input input-bordered join-item rounded-xl w-64"
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

      {/* ====== Social media icons ====== */}
      <div className="mt-8 flex justify-center gap-6">
        <a
          href="https://www.instagram.com/ntu_n3si/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-primary transition-transform duration-300 hover:scale-110"
          aria-label="Instagram"
        >
          <FontAwesomeIcon icon={faInstagram} size="lg" />
        </a>
        <a
          href="https://www.facebook.com/profile.php?id=61551782162253"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-primary transition-transform duration-300 hover:scale-110"
          aria-label="Facebook"
        >
          <FontAwesomeIcon icon={faFacebookF} size="lg" />
        </a>
        <a
          href="https://line.me/ti/g/NBzVNC2dN-"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-primary transition-transform duration-300 hover:scale-110"
          aria-label="Line"
        >
          <FontAwesomeIcon icon={faLine} size="lg" />
        </a>
      </div>

      {/* ====== Copyright text ====== */}
      <div className="mt-6 text-center text-sm opacity-70">
        © {new Date().getFullYear()} NTUN3SI 國安社. All rights reserved.
      </div>
    </footer>
  );
}
