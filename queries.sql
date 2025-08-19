DROP SCHEMA IF EXISTS BOOKS CASCADE;

-- create schema
CREATE SCHEMA BOOKS;

-- set search path
SET search_path TO BOOKS;

-- enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- create books table dengan uuid primary key
CREATE TABLE books (
    book_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) UNIQUE NOT NULL,
    author VARCHAR(255),
    isbn VARCHAR(13) UNIQUE NOT NULL,
    language VARCHAR(50),
    finished_month_year VARCHAR(20),
    cover_url TEXT  -- stores base64 images or urls
);

-- create book_reviews table dengan uuid references
CREATE TABLE book_reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(book_id),
    summary_text TEXT,
    highlight_text TEXT[]
);

-- sample data (uuid akan auto-generate)
INSERT INTO books (title, author, isbn, language, finished_month_year)
VALUES ('A Tale for the Time Being', 'Ruth Ozeki', '9780143124870', 'English', 'June 2024');


-- note: cover_url akan diisi dengan base64 image atau default image path
-- note: untuk insert review, gunakan book_id uuid yang sudah di-generate


