import express from 'express';
import { getBooks, getBookById } from '../services/bookService.js';

const router = express.Router();

/**
 * home route: show the home page with sorted books
 * @route GET /
 */
router.get("/", async (req, res) => {
  try {
    const sortBy = req.query.sort;
    const books = await getBooks(sortBy);
    res.render("home.ejs", { books: books, isAdmin: req.isAdmin });
  } catch (err) {
    console.error("error fetching data for home page", err);
    res.send(`
      <h1>error details:</h1>
      <p><strong>message:</strong> ${err.message}</p>
      <p><strong>stack:</strong> <pre>${err.stack}</pre></p>
    `);
  }
});

/**
 * review route: show the review page for a specific book
 * @route GET /review/:book_id
 */
router.get("/review/:book_id", async (req, res) => {
  const bookId = req.params.book_id;

  try {
    const book = await getBookById(bookId);
    
    if (book) {
      res.render("review.ejs", { book: book, isAdmin: req.isAdmin });
    } else {
      res.status(404).send("book not found");
    }
  } catch (err) {
    console.error("error fetching data for review page", err);
    res.status(500).send("internal server error");
  }
});

/**
 * about route: show the about page
 * @route GET /about
 */
router.get("/about", (req, res) => {
  res.render("about.ejs");
});

export default router;
