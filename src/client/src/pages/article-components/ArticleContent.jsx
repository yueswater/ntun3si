/**
 * Article Content component - displays the main article with title, image, and content
 * @param {Object} article - Article object with title, previewImg, etc.
 * @param {string} html - Parsed HTML content of the article
 */
export default function ArticleContent({ article, html }) {
  if (!article) return null;

  return (
    <main className="col-span-12 lg:col-span-8">
      <article>
        <h1 className="text-3xl font-bold mb-6">{article.title}</h1>

        {article.previewImg && (
          <img
            src={article.previewImg}
            alt={article.title}
            className="rounded-lg mb-6 w-full"
          />
        )}

        <div
          id="article-content"
          className="prose prose-lg prose-neutral dark:prose-invert max-w-none leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </main>
  );
}
