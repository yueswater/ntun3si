// generate-sitemap.js
import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import fetch from 'node-fetch';
import { resolve } from 'path';

const SITE_URL = 'https://ntun3si.space';

// 你的靜態頁面
const staticPages = [
  '/',
  '/articles',
  '/events',
  '/about',
  '/join'
];

async function generateSitemap() {
  let articles = [];

  try {
    const res = await fetch(`${SITE_URL}/api/articles`);
    articles = await res.json();
  } catch (err) {
    console.error('❌ 無法取得文章 API：', err);
  }

  // 寫入 React build 輸出的 dist/ 裡面
  const writePath = resolve('./src/client/dist/sitemap.xml');
  const sitemap = new SitemapStream({ hostname: SITE_URL });
  const writeStream = createWriteStream(writePath);

  // 加入靜態路由
  staticPages.forEach((page) => {
    sitemap.write({ url: page, changefreq: 'weekly', priority: 1.0 });
  });

  // 加入文章路由
  articles.forEach((a) => {
    sitemap.write({
      url: `/article/${a.slug}`,
      changefreq: 'weekly',
      priority: 0.8,
    });
  });

  sitemap.end();
  await streamToPromise(sitemap);

  console.log('✔ sitemap.xml 產生成功：', writePath);
}

generateSitemap();
