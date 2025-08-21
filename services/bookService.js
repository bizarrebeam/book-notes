import { db } from '../config/database.js';

/**
 * get books from the database and sort them
 * @param {string} sortBy - how to sort the books ('title' or 'recently-read')
 * @returns {Promise<Array>} - a promise that resolves to an array of books
 */
export async function getBooks(sortBy) {
  let orderBy = "";
  if (sortBy === "title") {
    orderBy = "ORDER BY books.title";
  } else if (sortBy === "recently-read") {
    orderBy = "ORDER BY TO_DATE(books.finished_month_year, 'Month YYYY') DESC";
  }

  const booksQuery = `
    SELECT books.book_id, books.title, books.author, books.isbn, books.language, 
           books.finished_month_year, books.cover_url, book_reviews.summary_text
    FROM books
    JOIN book_reviews ON books.book_id = book_reviews.book_id
    ${orderBy};
  `;
  const result = await db.query(booksQuery);
  return result.rows;
}

/**
 * get a single book by id with full details
 * @param {string} bookId - book uuid
 * @returns {Promise<Object|null>} - book object or null if not found
 */
export async function getBookById(bookId) {
  const bookQuery = `
    SELECT books.book_id, books.title, books.author, books.isbn, books.language, 
           books.finished_month_year, books.cover_url, 
           book_reviews.summary_text, book_reviews.highlight_text
    FROM books
    JOIN book_reviews ON books.book_id = book_reviews.book_id
    WHERE books.book_id = $1;
  `;
  const result = await db.query(bookQuery, [bookId]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * create a new book and review
 * @param {Object} bookData - book information
 * @param {Object} reviewData - review information
 * @returns {Promise<string>} - created book id
 */
export async function createBook(bookData, reviewData) {
  const { title, author, isbn, language, finished_at, cover_url } = bookData;
  const { summary_text, highlight_text } = reviewData;

  // insert book 
  const bookQuery = `
    INSERT INTO books (title, author, isbn, language, finished_month_year, cover_url)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (isbn) DO NOTHING
    RETURNING book_id;
  `;
  const bookResult = await db.query(bookQuery, [title, author, isbn, language, finished_at, cover_url]);

  let bookId;
  if (bookResult.rows.length > 0) {
    bookId = bookResult.rows[0].book_id; 
  } else {
    // if book already exists, get its uuid
    const existQuery = `SELECT book_id FROM books WHERE isbn = $1;`;
    const existResult = await db.query(existQuery, [isbn]);
    bookId = existResult.rows[0].book_id;
  }

  // insert review
  const reviewQuery = `
    INSERT INTO book_reviews (book_id, summary_text, highlight_text)
    VALUES ($1, $2, $3);
  `;
  await db.query(reviewQuery, [bookId, summary_text, highlight_text]);

  return bookId;
}

/**
 * update existing book and review
 * @param {string} bookId - book uuid
 * @param {Object} bookData - book information
 * @param {Object} reviewData - review information
 */
export async function updateBook(bookId, bookData, reviewData) {
  const { title, author, isbn, language, finished_at } = bookData;
  const { summary_text, highlight_text } = reviewData;

  // update book table
  const bookQuery = `
    UPDATE books 
    SET title = $1, author = $2, isbn = $3, language = $4, finished_month_year = $5
    WHERE book_id = $6;
  `;
  await db.query(bookQuery, [title, author, isbn, language, finished_at, bookId]);

  // update review table
  const reviewQuery = `
    UPDATE book_reviews 
    SET summary_text = $1, highlight_text = $2
    WHERE book_id = $3;
  `;
  await db.query(reviewQuery, [summary_text, highlight_text, bookId]);
}

/**
 * delete book and associated review
 * @param {string} bookId - book uuid
 */
export async function deleteBook(bookId) {
  // delete review first (foreign key constraint)
  await db.query('DELETE FROM book_reviews WHERE book_id = $1', [bookId]);
  
  // then delete book
  await db.query('DELETE FROM books WHERE book_id = $1', [bookId]);
}
