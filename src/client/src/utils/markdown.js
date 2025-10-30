import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";

/**
 * Rehype plugin to wrap images in figure with figcaption
 */
function rehypeFigure() {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      // Only process img tags that are direct children of p tags
      if (
        node.tagName === "img" &&
        parent &&
        parent.tagName === "p" &&
        parent.children.length === 1
      ) {
        const alt = node.properties.alt || "";

        // Create figure element
        const figure = {
          type: "element",
          tagName: "figure",
          properties: {},
          children: [
            node,
            {
              type: "element",
              tagName: "figcaption",
              properties: {},
              children: [{ type: "text", value: alt }],
            },
          ],
        };

        // Replace the paragraph with the figure
        parent.children[index] = figure;
        parent.tagName = "div"; // Convert p to div to avoid nesting issues
      }
    });
  };
}

/**
 * Convert Markdown string into HTML string
 * for ArticleContent dangerouslySetInnerHTML usage
 */
export async function markdownToHtml(md) {
  if (!md) return "";

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeFigure)
    .use(rehypeStringify)
    .process(md);

  return String(file);
}
