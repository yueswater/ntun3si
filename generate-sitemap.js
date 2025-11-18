import { SitemapStream, streamToPromise } from "sitemap";
import { createWriteStream } from "fs";
import { resolve } from "path";

const SITE_URL = "https://ntun3si.space";

async function fetchJson(path) {
  const res = await fetch(`${SITE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`Fetch ${path} failed: ${res.status}`);
  }
  return res.json();
}

async function generateSitemap() {
  const staticPages = [
    "/",
    "/about",
    "/events",
    "/articles"
  ];

  let articles = [];
  let events = [];

  try {
    articles = await fetchJson("/api/articles");
  } catch (e) {
    console.error("取文章列表失敗:", e.message);
  }

  try {
    events = await fetchJson("/api/events");
  } catch (e) {
    console.error("取活動列表失敗:", e.message);
  }

  const writePath = resolve("src/client/dist/sitemap.xml");
  const sitemap = new SitemapStream({ hostname: SITE_URL });
  const writeStream = createWriteStream(writePath);
  sitemap.pipe(writeStream);

  staticPages.forEach((p) => {
    sitemap.write({ url: p, changefreq: "weekly", priority: 1.0 });
  });

  articles.forEach((a) => {
    if (!a.slug) return;

    sitemap.write({
      url: `/articles/${a.slug}`,
      changefreq: "weekly",
      priority: 0.8,
      lastmod: a.updatedAt || a.createdAt
    });
  });

  events.forEach((e) => {
    const id = e.uid || e.slug || e._id;
    if (!id) return;

    sitemap.write({
      url: `/events/${id}`,
      changefreq: "weekly",
      priority: 0.7,
      lastmod: e.updatedAt || e.date
    });
  });

  sitemap.end();
  await streamToPromise(sitemap);
  console.log("✔ sitemap.xml 產生成功：", writePath);
}

generateSitemap().catch((err) => {
  console.error("產生 sitemap 發生錯誤:", err);
  process.exit(1);
});
