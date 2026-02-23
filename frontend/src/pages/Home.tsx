import { useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import TrendingNews from "@/components/TrendingNews";
import NewsCard from "@/components/NewsCard";
import AdBanner from "@/components/AdBanner";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNews } from "@/contexts/NewsContext";
import { getLocalizedArticleFieldsAsync } from "@/lib/localization";
import { announcementsAPI, Announcement } from "@/lib/api";
import { TranslatedText } from "@/components/TranslatedContent";

const Home = () => {
  const { t, language } = useLanguage();
  const { articles, loading } = useNews();
  const [translatedData, setTranslatedData] = useState<Map<string, { title: string; excerpt: string }>>(new Map());
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setAnnouncementsLoading(true);
        const data = await announcementsAPI.getAll();
        setAnnouncements(data);
      } catch (error) {
        console.error("Failed to load announcements:", error);
      } finally {
        setAnnouncementsLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  // Filter out Story category for homepage (My Story page will handle those)
  const nonStoryArticles = useMemo(
    () => articles.filter((a) => a.category.toLowerCase() !== "story"),
    [articles]
  );

  // Translate all non-story articles when language or articles change
  useEffect(() => {
    const translateArticles = async () => {
      const translations = new Map();
      const articlesToTranslate = [
        ...nonStoryArticles.filter(a => a.featured).slice(0, 3),
        ...nonStoryArticles.slice(0, 12)
      ];

      for (const article of articlesToTranslate) {
        try {
          const translated = await getLocalizedArticleFieldsAsync(article, language);
          translations.set(article.id, {
            title: translated.title,
            excerpt: translated.excerpt,
          });
        } catch (error) {
          console.warn(`Translation failed for article ${article.id}:`, error);
        }
      }

      setTranslatedData(translations);
    };

    if (nonStoryArticles.length > 0) {
      translateArticles();
    }
  }, [nonStoryArticles, language]);
  
  // Get featured news from database - recalculate when language changes
  const featuredNews = useMemo(() => {
    return nonStoryArticles.filter(a => a.featured).slice(0, 3).map(article => {
      const translated = translatedData.get(article.id);
      return {
        id: article.id,
        title: translated?.title || '',
        excerpt: translated?.excerpt || '',
        category: article.category,
        image: article.image,
        date: article.date,
      };
    });
  }, [nonStoryArticles, translatedData]);

  // Get latest news from database - recalculate when language changes
  const latestNews = useMemo(() => {
    return nonStoryArticles.slice(0, 12).map(article => {
      const translated = translatedData.get(article.id);
      return {
        id: article.id,
        title: translated?.title || '',
        excerpt: translated?.excerpt || '',
        category: article.category,
        image: article.image,
        date: article.date,
      };
    });
  }, [nonStoryArticles, translatedData]);

  const entertainmentNews = latestNews.filter(n => n.category === 'Entertainment').slice(0, 2);

  const getAnnouncementTitleField = (announcement: Announcement) => ({
    EN: announcement.titleEN,
    RW: announcement.titleRW,
    FR: announcement.titleFR,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <HeroBanner />
      <TrendingNews />
      
      {/* Top Full-Width Ad Banner */}
      <div className="w-full bg-muted py-4">
        <div className="container mx-auto px-4">
          <AdBanner size="large" position="banner" />
        </div>
      </div>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <p className="text-muted-foreground">Loading articles...</p>
          </div>
        ) : (
          /* Main Layout: Left Content + Right Sticky Sidebar */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Content Area */}
            <div className="lg:col-span-3 space-y-8">
              {/* Featured News Grid */}
              {featuredNews.length > 0 && (
                <section>
                  <h2 className="text-3xl font-bold text-navy mb-6 border-l-4 border-gold pl-4">
                    {t('home.featuredNews') || 'Featured News'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {featuredNews.map((news) => (
                      <NewsCard key={news.id} {...news} featured />
                    ))}
                  </div>
                </section>
              )}

              {/* Latest News Section */}
              <section>
                <h2 className="text-3xl font-bold text-navy mb-6 border-l-4 border-gold pl-4">
                  {t('home.latestNews')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {latestNews.slice(0, 6).length > 0 ? (
                    latestNews.slice(0, 6).map((news) => (
                      <NewsCard key={news.id} {...news} showExcerpt={false} />
                    ))
                  ) : (
                    <p className="text-muted-foreground col-span-2">{t('home.noArticles') || 'No articles yet. Add some from the admin panel!'}</p>
                  )}
                </div>
              </section>

            {/* Mid Content Ad */}
            <AdBanner size="large" position="article" />
            
            {/* More News */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {latestNews.slice(6, 12).map((news) => (
                  <NewsCard key={news.id} {...news} showExcerpt={false} />
                ))}
              </div>
            </section>

            {/* Entertainment Section */}
            {entertainmentNews.length > 0 && (
              <section>
                <h2 className="text-3xl font-bold text-navy mb-6 border-l-4 border-gold pl-4">
                  {t('home.entertainment')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {entertainmentNews.map((news) => (
                    <NewsCard key={news.id} {...news} showExcerpt={false} />
                  ))}
                </div>
              </section>
            )}

              {/* Bottom Content Ad */}
              <AdBanner size="large" position="footer" />
            </div>

          {/* Right Sticky Sidebar for Ads */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Ad Section 1 */}
              <div className="rounded-lg overflow-hidden">
                <AdBanner size="medium" position="sidebar" />
              </div>

              {/* Announcements */}
              <div className="bg-navy text-white p-6 rounded-lg">
                <h3 className="text-gold text-xl font-bold mb-4 border-b border-gold/30 pb-2">
                  {t('home.quickLinks')}
                </h3>
                {announcementsLoading ? (
                  <p className="text-sm text-white/60">Loading announcements...</p>
                ) : announcements.length > 0 ? (
                <ul className="space-y-3">
                    {announcements.map((announcement) => {
                      const titleField = getAnnouncementTitleField(announcement);
                      const fallbackTitle = announcement.titleEN || announcement.titleRW || announcement.titleFR || '';
                      return (
                        <li key={announcement.id}>
                          <Link
                            to={`/announcements/${announcement.id}`}
                            className="flex items-center gap-2 hover:text-gold transition-colors text-sm"
                          >
                        <span className="text-gold">→</span>
                            <TranslatedText
                              field={titleField}
                              language={language}
                              fallback={fallbackTitle}
                            />
                          </Link>
                    </li>
                      );
                    })}
                </ul>
                ) : (
                  <p className="text-sm text-white/60">No announcements available</p>
                )}
              </div>

              {/* Ad Section 2 */}
              <AdBanner size="medium" position="sidebar" />

              {/* Popular Stories */}
              {latestNews.length > 0 && (
                <div className="bg-navy text-white p-6 rounded-lg">
                  <h3 className="text-gold text-xl font-bold mb-4 border-b border-gold/30 pb-2">
                    {t('home.popularStories')}
                  </h3>
                  <ol className="space-y-4">
                    {latestNews.slice(0, 5).map((news, i) => (
                      <li key={news.id} className="flex gap-3 pb-3 border-b border-gold/20 last:border-0">
                        <span className="text-2xl font-bold text-gold flex-shrink-0">
                          {i + 1}
                        </span>
                        <Link
                          to={`/news/${news.id}`}
                          className="text-sm hover:text-gold transition-colors line-clamp-2"
                        >
                          {news.title}
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Ad Section 3 */}
              <AdBanner size="medium" position="sidebar" />
            </div>
          </aside>
        </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Home;
