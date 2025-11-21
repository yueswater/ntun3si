import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * Related Articles sidebar component
 * @param {Array} articles - Array of related article objects
 */
export default function RelatedArticles({ articles }) {
  const { t } = useTranslation();

  if (!articles || articles.length === 0) return null;

  return (
    <aside className="col-span-2 hidden xl:block">
      <div className="sticky top-24">
        <h3 className="font-semibold mb-3 text-gray-700">
          {t("article.related_articles")}
        </h3>

        <ul className="space-y-3 text-sm">
          {articles.map((article) => (
            <li key={article._id}>
              <Link
                to={`/articles/${article.slug}`}
                className="block hover:text-primary transition-colors"
              >
                {article.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
