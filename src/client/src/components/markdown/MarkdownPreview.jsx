import React, { forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const MarkdownPreview = forwardRef(function MarkdownPreview({ content }, ref) {
  return (
    <div
      ref={ref}
      className="p-6 overflow-y-auto bg-base-200 h-full min-h-[480px]"
    >
      <div className="prose prose-neutral max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeKatex]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
});

export default MarkdownPreview;
