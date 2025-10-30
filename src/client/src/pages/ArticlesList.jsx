import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getList } from "../utils/api";
import { readingTime } from "reading-time-estimator";

export default function ArticlesList() {
  const [articles, setArticles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    getList("articles")
      .then((data) => setArticles(data))
      .catch((err) => console.error("Failed to fetch articles:", err));
  }, []);

  const totalPages = Math.ceil(articles.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentItems = articles.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="container mx-auto px-6 py-10 max-w-5xl">
      <div className="flex flex-col divide-y divide-gray-200">
        {currentItems.map((article) => {
          const imgSrc =
            article.previewImg ||
            article.cover ||
            "https://via.placeholder.com/400x400?text=No+Image";

          //Use reading-time-estimator to calculate reading time
          const stats = readingTime(
            article.content_md || article.content_html || "",
            200, //Read 300 words per minute
            "zh-tw" //Set the language to Traditional Chinese
          );

          return (
            <Link
              key={article._id || article.id}
              to={`/articles/${article.slug}`}
              className="flex flex-col sm:flex-row gap-6 py-6 hover:bg-gray-50 rounded-xl px-4 transition"
            >
              <div className="w-full sm:w-40 md:w-48 h-40 md:h-48 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                <img
                  src={imgSrc}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#03045E] mb-2">
                  {article.title}
                </h2>
                <p className="text-gray-600 line-clamp-2 mb-2">
                  {article.preview || article.content_md || "暫無簡介"}
                </p>
                <p className="text-sm text-gray-500">
                  預計閱讀時間：約 {Math.ceil(stats.minutes)} 分鐘
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`btn btn-sm rounded-full ${
                currentPage === num
                  ? "bg-[#03045E] text-white"
                  : "bg-gray-200 text-[#03045E] hover:bg-gray-300"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
