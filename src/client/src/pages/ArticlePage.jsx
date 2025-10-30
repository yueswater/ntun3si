import { useMemo } from "react";
import { useParams } from "react-router-dom";
import useFetchList from "../hooks/useFetchList";
import useArticleData from "./article-components/useArticleData";
import useScrollSpy from "./article-components/useScrollSpy";
import TableOfContents from "./article-components/TableOfContents";
import ArticleContent from "./article-components/ArticleContent";
import RelatedArticles from "./article-components/RelatedArticles";

/**
 * Article Page Component
 * Displays a full article with table of contents and related articles
 */
export default function ArticlePage() {
  const { slug } = useParams();
  const { data: articles } = useFetchList("articles");

  // Fetch and process article data
  const { article, html, toc, isLoading } = useArticleData(slug);

  // Scroll spy for TOC highlighting
  const { activeSection, currentSection, scrollToId, toggleSection } =
    useScrollSpy(toc, html);

  // Get related articles (other articles excluding current one)
  const relatedArticles = useMemo(() => {
    return articles.filter((a) => a.slug !== slug).slice(0, 5);
  }, [articles, slug]);

  // Loading state
  if (isLoading || !article) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-10 grid grid-cols-12 gap-8">
      {/* Left Sidebar - Table of Contents */}
      <TableOfContents
        toc={toc}
        activeSection={activeSection}
        currentSection={currentSection}
        onToggleSection={toggleSection}
        onScrollToId={scrollToId}
      />

      {/* Main Content - Article */}
      <ArticleContent article={article} html={html} />

      {/* Right Sidebar - Related Articles */}
      <RelatedArticles articles={relatedArticles} />
    </div>
  );
}
