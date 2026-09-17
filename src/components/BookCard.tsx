import React from 'react';
import { Edit2, Trash2, BookOpen, Layers } from 'lucide-react';
import { Book } from '../types';
import { BookCover } from './BookCover';

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onEdit,
  onDelete,
}) => {
  const isAvailable = book.availableCopies > 0;

  return (
    <div
      id={`book-card-${book.id}`}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col overflow-hidden group relative"
    >
      {/* Top Banner / Cover Display Area */}
      <div className="relative p-5 pb-3 bg-gradient-to-b from-slate-50 to-slate-100/60 flex justify-center items-center border-b border-slate-100">
        {/* 'Availability' Status Badge: visually distinguishes Available vs Checked Out */}
        <div className="absolute top-3 left-3 z-10">
          <span
            id={`availability-badge-${book.id}`}
            data-testid="availability-badge"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-2xs transition-colors ${
              isAvailable
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span>{isAvailable ? 'Available' : 'Checked Out'}</span>
          </span>
        </div>

        {/* Quick Action Buttons (Edit & Delete) */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-xs rounded-xl p-1 shadow-2xs border border-slate-200/80">
          <button
            id={`edit-card-book-${book.id}`}
            type="button"
            onClick={() => onEdit(book)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
            title="Edit Book"
            aria-label={`Edit ${book.title}`}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            id={`delete-card-book-${book.id}`}
            type="button"
            onClick={() => onDelete(book)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete Book"
            aria-label={`Delete ${book.title}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Book Cover Present in the card */}
        <div className="mt-8 mb-2 w-28 h-40 sm:w-32 sm:h-44 rounded-lg overflow-hidden shadow-md border border-slate-300/60 bg-slate-200 transition-transform duration-200 group-hover:scale-105 shrink-0">
          <BookCover
            title={book.title}
            coverUrl={book.coverImageUrl}
            isbn={book.isbn}
            category={book.category}
          />
        </div>
      </div>

      {/* Book Metadata Section */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100/80 truncate max-w-[130px]">
              {book.category}
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              #{book.id}
            </span>
          </div>

          <h3
            className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors"
            title={book.title}
          >
            {book.title}
          </h3>

          <p className="text-xs text-slate-600 mt-1 truncate">
            by <span className="font-medium text-slate-700">{book.author}</span>
          </p>

          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            {book.publisher} &bull; {book.publicationYear}
          </p>
        </div>

        {/* Bottom Details (ISBN & Copies Inventory) */}
        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
            <span className="text-slate-400 font-sans">ISBN</span>
            <span className="truncate max-w-[140px]">{book.isbn}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-slate-500 text-[11px]">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Copies:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-800">
                {book.availableCopies}
              </span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-600">{book.totalCopies} total</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
