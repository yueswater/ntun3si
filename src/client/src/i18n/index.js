// src/i18n/index.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// 這兩個路徑是相對於本檔案（index.js）
import zh from "./zh.json";
import en from "./en.json";

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: "zh", // 預設語言
  fallbackLng: "zh", // 找不到時退回中文
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
