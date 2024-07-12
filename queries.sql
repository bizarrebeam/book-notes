CREATE TABLE books (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(255) UNIQUE NOT NULL,
    author VARCHAR(255),
    cover_id VARCHAR(13)    
);

CREATE TABLE book_reviews (
    review_id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(book_id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    summary_text TEXT,
    review_text TEXT,
    highlight_text TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);