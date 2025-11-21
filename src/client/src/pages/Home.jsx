import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import ArticleCard from "../components/card/ArticleCard";
import EventCard from "../components/card/EventCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faEye, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  const [articles, setArticles] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch articles and events in parallel
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articleRes, eventRes] = await Promise.all([
          axiosClient.get("/articles"),
          axiosClient.get("/events"),
        ]);
        setArticles(articleRes.data);
        setEvents(eventRes.data);
      } catch (err) {
        console.error("Failed to fetch homepage data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Featured + hot + others
  const featuredArticle = articles[0];
  const hotArticles = articles.slice(1, 6);
  const otherArticles = articles.slice(6);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* ================== Top Section ================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Featured */}
        <div className="lg:col-span-2">
          {featuredArticle && (
            <ArticleCard article={featuredArticle} variant="featured" />
          )}
        </div>

        {/* Hot Articles */}
        <div className="lg:col-span-1">
          <div className="bg-base-100 shadow rounded-box p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-base-200">
              <FontAwesomeIcon icon={faFire} className="text-primary text-xl" />
              <h3 className="text-lg font-bold text-primary">
                {t("home.hot_articles")}
              </h3>
            </div>

            <div className="space-y-3">
              {hotArticles.length > 0 ? (
                hotArticles.map((article, index) => (
                  <div
                    key={article._id}
                    className="flex items-start gap-3 pb-3 border-b border-base-200 last:border-0 last:pb-0"
                  >
                    <span className="text-lg font-bold text-primary flex-shrink-0 w-6">
                      {index + 1}
                    </span>

                    <div className="flex-1">
                      <ArticleCard article={article} variant="hot" />
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <FontAwesomeIcon icon={faEye} />
                        {article.views || 0} {t("home.views")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">
                  {t("home.no_hot_articles")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================== Recent Articles ================== */}
      {otherArticles.length > 0 && (
        <div className="mb-10">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold">{t("home.latest_articles")}</h2>

            <button
              onClick={() => navigate("/articles")}
              className="relative flex items-center gap-2 font-semibold text-[#03045E] px-5 py-2 rounded-full 
                overflow-hidden transition-all duration-300 border border-[#03045E]
                before:absolute before:left-0 before:top-0 before:h-full before:w-0 
                before:bg-[#03045E] before:transition-all before:duration-300 
                hover:before:w-full hover:text-white group"
            >
              <span className="relative z-10">{t("home.view_all")}</span>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="relative z-10 text-sm transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {otherArticles.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </div>
        </div>
      )}

      {/* ================== Upcoming Events ================== */}
      {events.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold">{t("home.upcoming_events")}</h2>

            <button
              onClick={() => navigate("/events")}
              className="relative flex items-center gap-2 font-semibold text-[#03045E] px-5 py-2 rounded-full 
                overflow-hidden transition-all duration-300 border border-[#03045E]
                before:absolute before:left-0 before:top-0 before:h-full before:w-0 
                before:bg-[#03045E] before:transition-all before:duration-300 
                hover:before:w-full hover:text-white group"
            >
              <span className="relative z-10">{t("home.view_all")}</span>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="relative z-10 text-sm transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
          </div>

          {/* 日期排序: 新→舊 */}
          {(() => {
            const sortedEvents = [...events].sort(
              (a, b) => new Date(b.date) - new Date(a.date)
            );

            return (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedEvents.slice(0, 4).map((event) => (
                  <EventCard key={event._id} event={event} variant="compact" />
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ================== Empty State ================== */}
      {articles.length === 0 && events.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">{t("home.no_content")}</p>
        </div>
      )}
    </div>
  );
}
