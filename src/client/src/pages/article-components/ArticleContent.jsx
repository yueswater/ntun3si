import "katex/dist/katex.min.css";

/**
 * Article Content component - displays the main article with title, image, and content
 * @param {Object} article - Article object with title, previewImg, tags, etc.
 * @param {string} html - Parsed HTML content of the article
 */
export default function ArticleContent({ article, html }) {
  if (!article) return null;

  return (
    <main className="col-span-12 lg:col-span-8">
      <article>
        {/* 標題 */}
        <h1 className="text-3xl font-bold mb-3">{article.title}</h1>

        {/* Tag 區塊 */}
        {article.hashtags && article.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {article.hashtags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-primary hover:text-white transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 預覽圖片 */}
        {article.previewImg && (
          <figure className="my-8 flex justify-center">
            <img
              src={article.previewImg}
              alt={article.title}
              className="max-w-[400px] w-full rounded-lg shadow-sm object-contain"
            />
            {article.caption && (
              <figcaption className="text-sm text-gray-500 mt-2 text-center">
                {article.caption}
              </figcaption>
            )}
          </figure>
        )}

        {/* 文章內容 */}
        <div
          id="article-content"
          className="prose prose-lg prose-neutral dark:prose-invert max-w-none leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </main>
  );
}
