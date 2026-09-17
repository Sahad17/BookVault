import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface BookCoverProps {
  title: string;
  coverUrl?: string;
  isbn?: string;
  category?: string;
  className?: string;
}

export const BookCover: React.FC<BookCoverProps> = ({
  title,
  coverUrl,
  isbn,
  category,
  className = '',
}) => {
  const [hasError, setHasError] = useState<boolean>(false);

  // Derive Open Library URL from ISBN if no custom cover URL is provided
  const cleanIsbn = isbn ? isbn.replace(/[^0-9X]/gi, '') : '';
  const resolvedUrl =
    coverUrl && coverUrl.trim() !== ''
      ? coverUrl.trim()
      : cleanIsbn
      ? `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg`
      : null;

  // Reset error whenever resolvedUrl changes
  React.useEffect(() => {
    setHasError(false);
  }, [resolvedUrl]);

  if (!resolvedUrl || hasError) {
    // Stylized, elegant book cover fallback with subtle spine and clean typography
    const displayTitle = title && title.trim() !== '' ? title.trim() : 'Book Vault';
    const isPreview = displayTitle.toLowerCase() === 'preview';

    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-between p-2.5 text-white bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 select-none shadow-inner border-l-2 border-indigo-400/30 overflow-hidden relative ${className}`}
        title={`${displayTitle} (Cover)`}
      >
        {/* Subtle decorative spine foil bar */}
        <div className="w-full flex items-center justify-center pt-0.5">
          <div className="w-6 h-0.5 rounded-full bg-white/25" />
        </div>

        {/* Center Content: Icon + Clean Non-broken Title */}
        <div className="my-auto flex flex-col items-center text-center px-1 max-w-full">
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center mb-1.5 shrink-0 shadow-2xs">
            <BookOpen className="w-3.5 h-3.5 text-indigo-100" />
          </div>
          <p className="text-[11px] font-bold leading-snug text-white line-clamp-3 break-normal hyphens-none">
            {isPreview ? 'Cover Preview' : displayTitle}
          </p>
          {category && !isPreview && (
            <span className="text-[9px] font-medium text-indigo-200/80 mt-1 max-w-[90%] truncate">
              {category}
            </span>
          )}
        </div>

        {/* Bottom indicator */}
        <div className="w-full flex items-center justify-center pb-0.5">
          <span className="text-[8px] tracking-wider text-indigo-200/60 uppercase font-mono">
            {cleanIsbn ? cleanIsbn.slice(0, 6) : 'LIBRARY'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={title}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`w-full h-full object-cover transition-opacity duration-200 ${className}`}
      loading="lazy"
    />
  );
};
