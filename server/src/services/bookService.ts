import books from '../data/books.json';

export interface BookExcerpt {
  bookName: string;
  author: string;
  excerpt: string;
}

/**
 * 随机获取一段名著文本
 */
export function getRandomExcerpt(): BookExcerpt {
  const bookIndex = Math.floor(Math.random() * books.length);
  const book = books[bookIndex];
  const excerptIndex = Math.floor(Math.random() * book.excerpts.length);
  const excerpt = book.excerpts[excerptIndex];

  return {
    bookName: book.name,
    author: book.author,
    excerpt,
  };
}

/**
 * 获取所有可用的书籍名称
 */
export function getBookNames(): string[] {
  return books.map(b => b.name);
}

/**
 * 根据书名获取随机片段
 */
export function getExcerptByBook(bookName: string): BookExcerpt | null {
  const book = books.find(b => b.name === bookName);
  if (!book) return null;

  const excerptIndex = Math.floor(Math.random() * book.excerpts.length);
  return {
    bookName: book.name,
    author: book.author,
    excerpt: book.excerpts[excerptIndex],
  };
}
