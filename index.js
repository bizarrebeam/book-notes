import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
db.connect();

// use middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

/**
 * get books from the database and sort them
 * @param {string} sortBy - how to sort the books ('title' or 'recently-read')
 * @returns {Promise<Array>} - a promise that resolves to an array of books
 */
async function getBooks(sortBy) {
  let orderBy = "";
  if (sortBy === "title") {
    orderBy = "ORDER BY books.title";
  } else if (sortBy === "recently-read") {
    orderBy = "ORDER BY TO_DATE(books.finished_month_year, 'Month YYYY') DESC";
  }

  const booksQuery = `
    SELECT books.book_id, books.title, books.author, books.isbn, books.language, books.finished_month_year, books.cover_url, book_reviews.summary_text
    FROM books
    JOIN book_reviews ON books.book_id = book_reviews.book_id
    ${orderBy};
  `;
  const result = await db.query(booksQuery);

  return result.rows;
}

// routes

/**
 * home route: show the home page with sorted books
 * @route GET /
 */
app.get("/", async (req, res) => {
  try {
    const sortBy = req.query.sort;
    const books = await getBooks(sortBy);
    res.render("home.ejs", { books: books });
  } catch (err) {
    console.error("error fetching data for home page", err);
    res.status(500).send("internal server error");
  }
});

/**
 * review route: show the review page for a specific book
 * @route GET /review/:book_id
 */
app.get("/review/:book_id", async (req, res) => {
  const bookId = req.params.book_id;

  try {
    const bookQuery = `
      SELECT books.title, books.author, books.isbn, books.language, books.finished_month_year, books.cover_url, book_reviews.summary_text, book_reviews.highlight_text
      FROM books
      JOIN book_reviews ON books.book_id = book_reviews.book_id
      WHERE books.book_id = $1;
    `;
    const bookResult = await db.query(bookQuery, [bookId]);

    if (bookResult.rows.length > 0) {
      const book = bookResult.rows[0];
      res.render("review.ejs", { book: book });
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
app.get("/about", (req, res) => {
  res.render("about.ejs");
});

/**
 * compose route: show the compose page
 * yet to implement authentication, so nothing on the webpage linked to this route
 * (have to manually navigate to /compose)
 * @route GET /compose
 */
app.get("/compose", (req, res) => {
  res.render("compose.ejs");
});

/**
 * handle form submission from the compose page and save to database
 * @route POST /compose
 */
app.post("/compose", async (req, res) => {
  try {
    const { title, author, isbn, language, finished_at, summarize, highlights } = req.body;

    // get the cover url
    let coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    try {
      await axios.get(coverUrl);
    } catch (err) {
      coverUrl = "/assets/default.png";
    }

    // insert book into the database
    const bookQuery = `
      INSERT INTO books (title, author, isbn, language, finished_month_year, cover_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (isbn) DO NOTHING
      RETURNING book_id;
    `;
    const bookResult = await db.query(bookQuery, [title, author, isbn, language, finished_at, coverUrl]);

    let bookId;
    if (bookResult.rows.length > 0) {
      bookId = bookResult.rows[0].book_id;
    } else {
      // if the book is already in the database
      const existQuery = `SELECT book_id FROM books WHERE isbn = $1;`;
      const existResult = await db.query(existQuery, [isbn]);
      bookId = existResult.rows[0].book_id;
    }

    // insert review into the database
    const reviewQuery = `
      INSERT INTO book_reviews (book_id, summary_text, highlight_text)
      VALUES ($1, $2, $3);
    `;
    await db.query(reviewQuery, [bookId, summarize, highlights]);

    res.redirect("/");
  } catch (err) {
    console.error("trouble saving to the database", err);
    res.status(500).send("internal server error");
  }
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
