import { useState } from "react";
import {
  faInstagram,
  faFacebookF,
  faLine,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
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

      if (!res.ok)
        throw new Error(data.message || t("footer.subscribe_failed"));
      alert(t("footer.subscribe_success"));
      setEmail("");
    } catch (err) {
      alert(`${t("footer.subscribe_failed")}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-base-200 text-base-content px-6 md:px-16 py-10">
      {/* ====== Main navigation area ====== */}
      <div
        className="
          flex flex-wrap justify-center text-center 
          md:justify-center md:text-left md:flex-nowrap 
          md:gap-x-16 gap-x-10 gap-y-8 px-2
        "
      >
        {/* Services section */}
        <nav className="space-y-2">
          <h6 className="footer-title">{t("footer.services.title")}</h6>
          <a className="link link-hover block">{t("footer.services.event")}</a>
          <a className="link link-hover block">{t("footer.services.submit")}</a>
          <a className="link link-hover block">
            {t("footer.services.members")}
          </a>
        </nav>

        {/* About section */}
        <nav className="space-y-2">
          <h6 className="footer-title">{t("footer.about.title")}</h6>
          <a className="link link-hover block">{t("footer.about.intro")}</a>
          <a className="link link-hover block">{t("footer.about.contact")}</a>
          <a className="link link-hover block">{t("footer.about.partners")}</a>
        </nav>

        {/* Policy section */}
        <nav className="space-y-2">
          <h6 className="footer-title">{t("footer.policy.title")}</h6>
          <a className="link link-hover block" href="/terms">
            {t("footer.policy.terms")}
          </a>
          <a className="link link-hover block">{t("footer.policy.privacy")}</a>
        </nav>

        {/* Newsletter subscription (desktop only) */}
        <form className="hidden md:block space-y-2" onSubmit={handleSubscribe}>
          <h6 className="footer-title">{t("footer.newsletter.title")}</h6>
          <label className="label">
            <span className="label-text">
              {t("footer.newsletter.subtitle")}
            </span>
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
              {loading
                ? t("footer.newsletter.loading")
                : t("footer.newsletter.subscribe")}
            </button>
          </fieldset>
        </form>
      </div>

      {/* ====== Newsletter (mobile only) ====== */}
      <form
        className="mt-8 block md:hidden text-center space-y-2"
        onSubmit={handleSubscribe}
      >
        <h6 className="footer-title">{t("footer.newsletter.title")}</h6>
        <label className="label justify-center">
          <span className="label-text">{t("footer.newsletter.subtitle")}</span>
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
            {loading
              ? t("footer.newsletter.loading")
              : t("footer.newsletter.subscribe")}
          </button>
        </fieldset>
      </form>

      {/* ====== Social icons ====== */}
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

      {/* ====== Copyright ====== */}
      <div className="mt-6 text-center text-sm opacity-70">
        © {new Date().getFullYear()} 臺大國安社. {t("footer.all_rights")}
      </div>
    </footer>
  );
}
