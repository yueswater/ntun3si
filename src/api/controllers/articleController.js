import Article from "../models/Article.js";
import User from "../models/User.js";
import { parseMarkdown } from "../utils/markdownParser.js";

/**
 * Create a new article
 */
export async function createArticle(req, res) {
  try {
    const { title, slug, content_md, previewImg, hashtags } = req.body;
    const content_html = parseMarkdown(content_md);

    // Find author by token
    const authorUser = await User.findOne({ uid: req.user.uid });
    if (!authorUser)
      return res.status(404).json({ message: "Author user not found" });

    const newArticle = await Article.create({
      title,
      slug,
      content_md,
      content_html,
      previewImg: previewImg || "",
      hashtags: hashtags?.slice(0, 5) || [],
      author: authorUser._id,
    });

    res.status(201).json(newArticle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get all articles
 */
export async function getArticles(req, res) {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get article by UID or slug
 */
export async function getArticle(req, res) {
  try {
    const { id } = req.params;
    const article =
      (await Article.findOneAndUpdate(
        { uid: id },
        { $inc: { views: 1 } },
        { new: true }
      )) ||
      (await Article.findOneAndUpdate(
        { slug: id },
        { $inc: { views: 1 } },
        { new: true }
      ));

    if (!article) return res.status(404).json({ message: "Article not found" });
    res.json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get top popular articles
 */
export async function getHotArticles(req, res) {
  try {
    const articles = await Article.find();
    const scored = articles.map((a) => {
      const daysSince =
        (Date.now() - new Date(a.createdAt)) / (1000 * 60 * 60 * 24);
      const hotScore = a.views / (daysSince + 1);
      return { ...a._doc, hotScore };
    });
    const sorted = scored.sort((a, b) => b.hotScore - a.hotScore);
    res.json(sorted.slice(0, 5));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Update article (including hashtags)
 */
export async function updateArticle(req, res) {
  try {
    const { id } = req.params;
    const { title, slug, content_md, previewImg, hashtags } = req.body;
    const content_html = parseMarkdown(content_md);

    const updateData = {
      title,
      slug,
      content_md,
      content_html,
    };

    if (previewImg !== undefined) {
      updateData.previewImg = previewImg;
    }

    if (hashtags !== undefined) {
      updateData.hashtags = hashtags.slice(0, 5);
    }

    const updated = await Article.findOneAndUpdate({ uid: id }, updateData, {
      new: true,
    });

    if (!updated) return res.status(404).json({ message: "Article not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Delete article
 */
export async function deleteArticle(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Article.findOneAndDelete({ uid: id });
    if (!deleted) return res.status(404).json({ message: "Article not found" });
    res.json({ message: "Article deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
