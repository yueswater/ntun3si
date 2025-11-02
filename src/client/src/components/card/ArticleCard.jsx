import { useNavigate } from "react-router-dom";

export default function ArticleCard({ article, variant = "default" }) {
  const navigate = useNavigate();

  const defaultImg =
    "https://via.placeholder.com/800x450/e5e7eb/9ca3af?text=No+Image";

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Extract preview text from markdown
  const getPreviewText = (content, length = 100) => {
    if (!content) return "暫無內容";
    return content.replace(/[#*>`\[\]!]/g, "").slice(0, length) + "...";
  };

  // Featured article variant - large card
  if (variant === "featured") {
    return (
      <div
        className="card card-side bg-base-100 hover:bg-base-200 transition-colors cursor-pointer group overflow-hidden rounded-lg"
        onClick={() => navigate(`/articles/${article.slug}`)}
      >
        <figure className="w-[45%] max-w-[240px] shrink-0 aspect-square overflow-hidden rounded-lg">
          <img
            src={article.previewImg || defaultImg}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </figure>

        <div className="card-body p-6">
          <div className="badge badge-primary badge-sm mb-2">精選文章</div>
          <h2 className="card-title text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h2>
          <p className="text-sm text-gray-600 line-clamp-3 mt-2">
            {getPreviewText(article.content_md, 120)}
          </p>
          <div className="flex items-center justify-between mt-auto pt-4">
            <span className="text-xs text-gray-400">
              {formatDate(article.createdAt)}
            </span>
            <button className="btn btn-primary btn-xs">閱讀更多 →</button>
          </div>
        </div>
      </div>
    );
  }

  // Hot article variant - compact list item
  if (variant === "hot") {
    return (
      <div
        className="flex gap-3 cursor-pointer group"
        onClick={() => navigate(`/articles/${article.slug}`)}
      >
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h4>
          <span className="text-xs text-gray-400 mt-1 block">
            {formatDate(article.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  // Default variant - standard grid card
  return (
    <div
      className="card bg-base-100 hover:bg-base-200 transition-colors cursor-pointer group rounded-lg overflow-hidden"
      onClick={() => navigate(`/articles/${article.slug}`)}
    >
      <figure className="aspect-[16/10] overflow-hidden">
        <img
          src={article.previewImg || defaultImg}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </figure>
      <div className="card-body p-4">
        <h2 className="text-base font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {article.title}
        </h2>
        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
          {getPreviewText(article.content_md, 60)}
        </p>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-base-200">
          <span className="text-xs text-gray-400">
            {formatDate(article.createdAt)}
          </span>
          <div className="badge badge-outline badge-xs">文章</div>
        </div>
      </div>
    </div>
  );
}
