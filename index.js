import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;
const API_URL = "https://covers.openlibrary.org/";

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Booknotes-Capstone",
  password: "adelwebdev2024",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let search;
let sort = "review_id";

app.get("/", async (req, res) => { 
  try {
    const response = await db.query(
      `SELECT * FROM books
      JOIN book_reviews
      ON books.book_id = book_reviews.book_id
      ORDER BY ${sort} ASC`
    )

    const data = response.rows;

    res.render("index.ejs", {
      search: search,
      data: data,
    });

  } catch (err) {
    console.log("Couldn't execute query for home endpoint: ", err)
  }
});

app.get("/book", async (req, res) => {
  const bookTitle = req.query.title;
  const author = req.query.author;
  const coverId = req.query.coverId;

  try {
    const response = await db.query(
      `SELECT * FROM books
      JOIN book_reviews
      ON books.book_id = book_reviews.book_id`
    )

    const data = response.rows;
    const bookCheck = data.find((book) => book.title === req.query.title);
    const review = bookCheck ? bookCheck.review_text : undefined;
    const highlights = bookCheck ? bookCheck.highlight_text : undefined;
    const summary = bookCheck ? bookCheck.summary_text : undefined;
    const book_id = bookCheck ? bookCheck.book_id : undefined;

    res.render("addBook.ejs", {
      title: bookTitle,
      author: author,
      cover: coverId,
      review: review,
      highlights: highlights,
      summary: summary,
      book_id: book_id,
    })
  } catch (err) {
    console.log("Couldn't execute query for /book: ", err)
  }
 });

app.post("/sort", async (req, res) => {    
  sort = req.body.sort;    
  res.redirect("/");
})

app.post("/updateReview", async (req, res) => {
  const summary_text = req.body.summary_text;
  const review_text = req.body.review_text;
  const highlight_text = req.body.highlight_text;
  const rating = req.body.rating;

  const book_id = req.body.bookId;

  const currentDate = new Date().toISOString();

  try {
    const response = await db.query(
      `UPDATE book_reviews
      SET summary_text = $1, review_text = $2, highlight_text = $3, rating = $4, review_date = $5
      WHERE book_id = $6
      RETURNING *`, [summary_text, review_text, highlight_text, rating, currentDate, book_id]
    )

    const data = response.rows;
    console.log("Succesfully update", `${summary_text}, ${review_text}, ${highlight_text}, ${rating}, ${book_id}, ${currentDate}`);
    res.redirect("/");

  } catch (err) {
    console.log("Couldn't execute query for /updateReview: ", err)
  }
})

app.post("/addBook", async (req, res) => {
  const bookTitle = req.body.title;
  const coverId = req.body.cover_id;
  const author = req.body.author;

  const summary_text = req.body.summary_text;
  const review_text = req.body.review_text;
  const highlight_text = req.body.highlight_text;
  const rating = req.body.rating;

  const currentDate = new Date().toISOString();

  try {
    await db.query('BEGIN');
  
    const bookResponse = await db.query(
      `INSERT INTO books (title, author, cover_id)
      VALUES ($1, $2, $3)
      RETURNING *`, [bookTitle, author, coverId]
    );
  
    const bookData = bookResponse.rows;
    const book_id = bookData[0].book_id;
  
    const reviewResponse = await db.query(
      `INSERT INTO books_reviews (book_id, summary_text, review_text, highlight_text, rating, review_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`, [book_id, summary_text, review_text, highlight_text, rating, currentDate]
    );
  
    await db.query('COMMIT');
  
    console.log("Successfully added", `${bookTitle}, ${author}, ${coverId}, ${summary_text}, ${review_text}, ${highlight_text}, ${rating}, ${currentDate}`);
    res.redirect("/");
  
  } catch (err) {
    await db.query('ROLLBACK');
    console.log("Couldn't execute query for /addBook: ", err);
  }

})

app.delete("/delete/:id", async (req, res) => {
  const bookId = req.params.id;

  try {
    await db.query('BEGIN');
    await db.query(
      `DELETE FROM book_reviews
      WHERE book_id = $1`, [bookId]
    )
    await db.query(
      `DELETE FROM books
      WHERE book_id = $1`, [bookId]
    )
    await db.query('COMMIT');
    res.redirect("/");

  } catch (err) {
    await db.query('ROLLBACK');
    console.log("Couldn't execute query for /delete: ", err)
  }
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });