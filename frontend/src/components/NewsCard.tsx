import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslatedCategory } from "@/lib/localization";
import { normalizeImageUrl } from "@/lib/image-utils";

interface NewsCardProps {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  date: string;
  featured?: boolean;
  showExcerpt?: boolean; // Control whether to show excerpt (default: true for non-featured cards on category pages)
}

const NewsCard = ({ id, title, excerpt, category, image, date, featured = false, showExcerpt = true }: NewsCardProps) => {
  const { t, language } = useLanguage();
  const translatedCategory = getTranslatedCategory(category, t);
  if (featured) {
    return (
      <Link
        to={`/news/${id}`}
        className="group block bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in"
      >
        <div className="relative h-72 overflow-hidden">
          <img
            src={normalizeImageUrl(image)}
            alt={title}
            className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-news-red text-white text-xs font-bold rounded">
              {translatedCategory}
            </span>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-gold transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="text-muted-foreground mb-4 line-clamp-2">{excerpt}</p>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            {date}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/news/${id}`}
      className="group flex gap-4 bg-card rounded-lg overflow-hidden shadow hover:shadow-md transition-all duration-300 animate-fade-in"
    >
      <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg">
        <img
          src={normalizeImageUrl(image)}
          alt={title}
          className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      <div className="flex-1 p-4 min-w-0">
        <span className="inline-block px-2 py-1 bg-navy/10 text-navy text-xs font-semibold mb-2 rounded">
          {translatedCategory}
        </span>
        <h4 className="font-bold text-foreground group-hover:text-gold transition-colors line-clamp-2 mb-2">
          {title}
        </h4>
        {showExcerpt && excerpt && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {excerpt}
          </p>
        )}
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          {date}
        </div>
      </div>
    </Link>
  );
};

export default NewsCard;
