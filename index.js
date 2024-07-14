import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "book-shelves",
  password: "adelwebdev2024",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Function to fetch books and their covers
async function getBooksAndCovers() {
  const booksQuery = `
    SELECT books.title, books.author, books.isbn, books.language, books.finished_month_year, book_reviews.summary_text
    FROM books
    JOIN book_reviews ON books.book_id = book_reviews.book_id;
  `;
  const booksResult = await db.query(booksQuery);
  const books = booksResult.rows;

  // Fetch book covers from the Open Library API
  const booksWithCovers = await Promise.all(books.map(async (book) => {
    const coverUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;
    try {
      // Try fetching the cover to ensure it exists
      await axios.get(coverUrl);
      book.coverUrl = coverUrl;
    } catch (error) {
      // If the cover does not exist, use a default image
      book.coverUrl = "/assets/default.png";
    }
    return book;
  }));

  return booksWithCovers;
}

app.get("/", async (req, res) => {
  try {
    const booksWithCovers = await getBooksAndCovers();
    res.render("home.ejs", { books: booksWithCovers });
  } catch (err) {
    console.error("Error fetching data for home page", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/review", (req, res) => { 
  res.render("review.ejs");
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

    const bookQuery = `
      INSERT INTO books (title, author, isbn, language, finished_month_year)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (isbn) DO NOTHING
      RETURNING book_id;
    `;
    const bookResult = await db.query(bookQuery, [title, author, isbn, language, finished_at]);

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
