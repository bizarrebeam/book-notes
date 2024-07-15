CREATE TABLE books (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(255) UNIQUE NOT NULL,
    author VARCHAR(255),
    isbn VARCHAR(13) UNIQUE NOT NULL,  -- ISBN used for fetching the cover
    language VARCHAR(50),
    finished_month_year VARCHAR(20)  -- Store month and year as text
);

CREATE TABLE book_reviews (
    review_id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(book_id),
    summary_text TEXT,
    highlight_text TEXT[], 
);

-- to make the load faster, i decide to store the cover image in the database
ALTER TABLE books ADD COLUMN cover_url VARCHAR(255);

-- populate first entry
INSERT INTO books (title, author, isbn, language, finished_month_year)
VALUES ('A Tale for the Time Being', 'Ruth Ozeki', '9780143124870', 'English', 'June 2024');

INSERT INTO book_reviews (book_id, summary_text, highlight_text)
VALUES 
(1, 
 'A story that alternates between a Japanese schoolgirl, Nao, and a Canadian author, Ruth. Ruth finds Nao\'s diary washed up on the shore where she lives and presumes the 2011 Tōhoku tsunami is what brought the diary to her. The story unfolds with Ruth becoming absorbed, page by page, in finding out what ultimately happened to Nao, as Nao pours out her difficult life through the diary. What initially intrigued me was whether the tsunami really connected Nao\'s life to Ruth through the diary. However, I found myself not in a hurry to uncover the truth. Instead, I paced slowly with Nao\'s tale. It\'s heartbreaking as Nao shares her life spanning three generations: her suicidal father, her Buddhist nun great-grandmother, and her deceased kamikaze grand-uncle. She recounts the bullying and harassment she endures every day in a teen\'s language, as if it were normal reality to her. The opening of the book was, "Hi! My name is Nao, and I am a time being." From that point on, I positioned myself as Ruth, slowly uncovering the pages without haste, and allowing myself to be a time being—whether present or past—connected with Nao\'s time.', 
 ARRAY[
    'Or maybe none of these things will happen except in my mind and yours, because, like I told you, together we’re making magic, at least for the time being.', 
    'Do not think that time simply flies away. Do not understand “flying” as the only function of time. If time simply flew away, a separation would exist between you and time. So if you understand time as only passing, then you do not understand the time being. To grasp this truly, every being that exists in the entire world is linked together as moments in time, and at the same time they exist as individual moments of time. Because all moments are the time being, they are your time being.',
    'What if I travel so far away in my dream that I can’t get back in time to wake up?',
    'As I have not much time left in life, I am determined not to be a coward. I will live as earnestly as I can and feel my feelings deeply. I will rigorously reflect upon my thoughts and emotions, and try to improve myself as much as I can.'
 ]
);


