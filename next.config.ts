import type { NextConfig } from "next";
import nextI18NextConfig from "./next-i18next.config"; // Импортируем настройки

const nextConfig: NextConfig = {
  reactStrictMode: true, // Для лучшей отладки и производительности
  swcMinify: true, // Включаем minify для улучшения производительности
  i18n: nextI18NextConfig.i18n, // Настройки i18n из next-i18next.config.ts
};

export default nextConfig;
