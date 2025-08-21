import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import axios from "axios";
import path from 'path';
import { db } from './config/database.js';
import databaseMiddleware from './middleware/database.js';
import { requireAdmin, checkAdminCredentials, generateToken, verifyToken } from './middleware/admin.js';
import { serveStaticCSS, serveStaticAssets, projectRoot } from './utils/static.js';
import sharp from "sharp";

const app = express();
const port = process.env.PORT || 3000;

// view engine
app.set('view engine', 'ejs');
app.set('views', path.join(projectRoot, 'views'));

// use middleware 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
// check for admin token and set isAdmin in all requests
app.use((req, res, next) => {
  const token = req.cookies?.adminToken;
  if (token) {
    const decoded = verifyToken(token);
    req.isAdmin = decoded && decoded.isAdmin;
  } else {
    req.isAdmin = false;
  }
  next();
});
app.use(express.static("public", {
  maxAge: '1d',
  etag: true
}));
app.use(databaseMiddleware);

// explicitly serve the css and assets
app.get('/styles/output.css', serveStaticCSS);
app.get('/assets/:filename', serveStaticAssets);

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
app.get("/about", (req, res) => {
  res.render("about.ejs");
});

/**
 * compose route: show the compose page
 * @route GET /compose
 */
app.get("/compose", requireAdmin, (req, res) => {
  res.render("compose.ejs", { 
    editMode: false, 
    book: null 
  });
});

/**
 * handle form submission from the compose page and save to database
 * @route POST /compose
 */
app.post("/compose", async (req, res) => {
  try {
    const { title, author, isbn, language, finished_at, summarize, highlights } = req.body;

    // download dan optimize image
    let coverUrl;
    try {
      const imageUrl = `https://covers.openlibrary.org/b-isbn/${isbn}-L.jpg`;
      const response = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 10000
      });
      
      // optimize image dengan sharp
      const optimizedBuffer = await sharp(response.data)
        .resize(300, 400, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ 
          quality: 60,
          progressive: true
        })
        .toBuffer();
      
      // convert to base64
      const base64Image = optimizedBuffer.toString('base64');
      coverUrl = `data:image/jpeg;base64,${base64Image}`;
      
    } catch (err) {
      coverUrl = "/assets/default.png";
    }

    // insert book 
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
      // kalau book sudah ada, ambil uuid-nya
      const existQuery = `SELECT book_id FROM books WHERE isbn = $1;`;
      const existResult = await db.query(existQuery, [isbn]);
      bookId = existResult.rows[0].book_id;
    }

    // insert review, uuid reference
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

// admin routes

/**
 * admin login page
 * @route GET /admin/login
 */
app.get("/admin/login", (req, res) => {
  res.render("admin/login.ejs");
});

/**
 * handle admin login
 * @route POST /admin/login
 */
app.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const isValid = await checkAdminCredentials(username, password);
    
    if (isValid) {
      const token = generateToken(username);
      res.cookie('adminToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      res.redirect('/');
    } else {
      res.render("admin/login.ejs", { error: "invalid credentials" });
    }
  } catch (err) {
    console.error("login error:", err);
    res.render("admin/login.ejs", { error: "login failed" });
  }
});

/**
 * admin logout
 * @route POST /admin/logout
 */
app.post("/admin/logout", (req, res) => {
  res.clearCookie('adminToken');
  res.redirect('/');
});

// admin CRUD routes

/**
 * delete book route
 * @route POST /admin/delete/:book_id
 */
app.post("/admin/delete/:book_id", requireAdmin, async (req, res) => {
  const bookId = req.params.book_id;
  
  try {
    // delete review first (foreign key constraint)
    await db.query('DELETE FROM book_reviews WHERE book_id = $1', [bookId]);
    
    // then delete book
    await db.query('DELETE FROM books WHERE book_id = $1', [bookId]);
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("error deleting book:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * edit book route - redirect to compose with data
 * @route GET /admin/edit/:book_id
 */
app.get("/admin/edit/:book_id", requireAdmin, async (req, res) => {
  const bookId = req.params.book_id;
  
  try {
    const bookQuery = `
      SELECT books.book_id, books.title, books.author, books.isbn, books.language, 
             books.finished_month_year, books.cover_url, 
             book_reviews.summary_text, book_reviews.highlight_text
      FROM books
      JOIN book_reviews ON books.book_id = book_reviews.book_id
      WHERE books.book_id = $1;
    `;
    const bookResult = await db.query(bookQuery, [bookId]);

    if (bookResult.rows.length > 0) {
      const book = bookResult.rows[0];
      res.render("compose.ejs", { 
        editMode: true, 
        book: book 
      });
    } else {
      res.status(404).send("book not found");
    }
  } catch (err) {
    console.error("error fetching book for edit:", err);
    res.status(500).send("internal server error");
  }
});

/**
 * update book route
 * @route POST /admin/update/:book_id
 */
app.post("/admin/update/:book_id", requireAdmin, async (req, res) => {
  const bookId = req.params.book_id;
  const { title, author, isbn, language, finished_at, summarize, highlights } = req.body;

  try {
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
    await db.query(reviewQuery, [summarize, highlights, bookId]);

    res.redirect("/");
  } catch (err) {
    console.error("error updating book:", err);
    res.status(500).send("internal server error");
  }
});


app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
