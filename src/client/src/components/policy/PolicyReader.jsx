import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function PolicyReader({ file }) {
  const [content, setContent] = useState("");

  useEffect(() => {
    const url = new URL(`./${file}`, import.meta.url);

    fetch(url)
      .then((r) => r.text())
      .then((text) => setContent(text));
  }, [file]);

  return (
    <div className="prose mx-auto max-w-3xl px-4 py-10">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
