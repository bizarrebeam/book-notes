import express from 'express';
import { requireAdmin } from '../middleware/admin.js';
import { getBookById, createBook, updateBook, deleteBook } from '../services/bookService.js';
import { processBookCover } from '../services/imageService.js';

const router = express.Router();

/**
 * compose route: show the compose page
 * @route GET /compose
 */
router.get("/compose", requireAdmin, (req, res) => {
  res.render("compose.ejs", { 
    editMode: false, 
    book: null 
  });
});

/**
 * handle form submission from the compose page and save to database
 * @route POST /compose
 */
router.post("/compose", requireAdmin, async (req, res) => {
  try {
    const { title, author, isbn, language, finished_at, summarize, highlights } = req.body;

    // download and optimize image
    console.log(`Creating new book with ISBN ${isbn}, fetching cover image`);
    const coverUrl = await processBookCover(isbn);

    // prepare data
    const bookData = { title, author, isbn, language, finished_at, cover_url: coverUrl };
    const reviewData = { summary_text: summarize, highlight_text: highlights };

    // create book and review
    const bookId = await createBook(bookData, reviewData);

    // redirect to the newly created book's review page
    res.redirect(`/review/${bookId}`);
  } catch (err) {
    console.error("trouble saving to the database", err);
    res.status(500).send("internal server error");
  }
});

/**
 * edit book route - redirect to compose with data
 * @route GET /admin/edit/:book_id
 */
router.get("/admin/edit/:book_id", requireAdmin, async (req, res) => {
  const bookId = req.params.book_id;
  
  try {
    const book = await getBookById(bookId);

    if (book) {
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
router.post("/admin/update/:book_id", requireAdmin, async (req, res) => {
  const bookId = req.params.book_id;
  const { title, author, isbn, language, finished_at, summarize, highlights } = req.body;

  try {
    // get the current book to check if ISBN changed
    const currentBook = await getBookById(bookId);
    
    let coverUrl = currentBook.cover_url; // keep existing cover by default
    
    // if ISBN changed, fetch new cover image
    if (currentBook && currentBook.isbn !== isbn) {
      console.log(`ISBN changed from ${currentBook.isbn} to ${isbn}, fetching new cover`);
      coverUrl = await processBookCover(isbn);
    }
    
    // if i requested to refetch cover 
    if (req.body.refetch_cover === 'true') {
      console.log(`Manual refetch requested for ISBN ${isbn}`);
      coverUrl = await processBookCover(isbn);
    }

    // prepare data
    const bookData = { title, author, isbn, language, finished_at, cover_url: coverUrl };
    const reviewData = { summary_text: summarize, highlight_text: highlights };

    // update book and review
    await updateBook(bookId, bookData, reviewData);

    // redirect to the updated book's review page
    res.redirect(`/review/${bookId}`);
  } catch (err) {
    console.error("error updating book:", err);
    res.status(500).send("internal server error");
  }
});

/**
 * delete book route
 * @route POST /admin/delete/:book_id
 */
router.post("/admin/delete/:book_id", requireAdmin, async (req, res) => {
  const bookId = req.params.book_id;
  
  try {
    await deleteBook(bookId);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("error deleting book:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
