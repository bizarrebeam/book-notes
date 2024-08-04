import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from 'dotenv';
import axios from "axios";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Database connected');
  release();
});

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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// retrieve books from the database, according to the sorting option
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

app.get("/", async (req, res) => {
  try {
    const sortBy = req.query.sort;
    const books = await getBooks(sortBy);
    res.render("home.ejs", { books: books });
  } catch (err) {
    console.error("Error fetching data for home page", err);
    res.status(500).send("Internal Server Error");
  }
});

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
      res.status(404).send("Book not found");
    }
  } catch (err) {
    console.error("Error fetching data for review page", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/about", (req, res) => { 
  res.render("about.ejs");
});  

app.get("/compose", (req, res) => { 
  res.render("compose.ejs");
});

// store submission from /compose to the database
app.post("/compose", async (req, res) => {
  try {
    const { title, author, isbn, language, finished_at, summarize, highlights } = req.body;

    // fetch cover url
    let coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    try {
      await axios.get(coverUrl);
    } catch (err) {
      coverUrl = "/assets/default.png";
    }

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
      // if the book already exists in the database
      const existQuery = `SELECT book_id FROM books WHERE isbn = $1;`;
      const existResult = await db.query(existQuery, [isbn]);
      bookId = existResult.rows[0].book_id;
    }

    // insert review into book_reviews table
    const reviewQuery = `
      INSERT INTO book_reviews (book_id, summary_text, highlight_text)
      VALUES ($1, $2, $3);
    `;
    await db.query(reviewQuery, [bookId, summarize, highlights]);

    res.redirect("/");

  } catch (err) {
    console.error("Trouble saving to the database", err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
