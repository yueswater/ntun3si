import { SitemapStream, streamToPromise } from "sitemap";
import { createWriteStream } from "fs";
import { resolve } from "path";

const BASE_URL = "https://ntun3si.space";

async function generateSitemap() {
  // 要輸出的 URL 列表
  const urls = [
    { url: "/", changefreq: "weekly", priority: 1.0 },
    { url: "/about", changefreq: "monthly" },
    { url: "/events", changefreq: "weekly" },
    { url: "/articles", changefreq: "weekly" },
  ];

  const sitemap = new SitemapStream({ hostname: BASE_URL });

  const writePath = resolve("src/client/dist/sitemap.xml");
  const writeStream = createWriteStream(writePath);

  sitemap.pipe(writeStream);

  urls.forEach((u) => sitemap.write(u));
  sitemap.end();

  await streamToPromise(sitemap);

  console.log("✔ sitemap.xml 產生成功：", writePath);
}

generateSitemap();
