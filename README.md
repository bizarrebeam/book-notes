# A Collection of Adelya's Reading

Welcome to my book notes web application! This is a collection of my reading notes--I summarize books and highlight sentences that resonate with me the most. Started this project as part of my capstone to learn about databases. This website is heavily influenced by Derek Sivers's book notes! (https://sive.rs/book)

## About the Project

I found myself enjoying reading during my long, first-year college break. Reading was a habit I forced on myself, but now I'm enjoying it for leisure -- even thinking each sentence from them that lingers on my mind is a waste for only keeping it with me. That was all I could think about when creating my capstone project for learning about databases. 

### Technologies Used

- **Database:** PostgreSQL
- **Book Covers and API:** OpenLibrary API through Axios
- **Backend:** Node.js and Express
- **Frontend:** TailwindCSS

The website is still a work in progress, but it's my first solo project debut. *sighing*

## Usage

If you have a time to spare to run this project locally, follow the steps below:

### Prerequisites

1. Please have [PostgreSQL](https://www.postgresql.org/download/) installed and set up.

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/book-notes-web-app.git
    cd book-notes-web-app
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Set up the database:**

    Open your PostgreSQL client and run the following queries (or simply copy on queries.sql) to create the necessary tables and populate the initial data:

    ```sql
    CREATE TABLE books (
        book_id SERIAL PRIMARY KEY,
        title VARCHAR(255) UNIQUE NOT NULL,
        author VARCHAR(255),
        isbn VARCHAR(13) UNIQUE NOT NULL,  -- ISBN used for fetching the cover
        language VARCHAR(50),
        finished_month_year VARCHAR(20),  -- store month and year as text
        cover_url VARCHAR(255)  -- to make the load faster, I decided to store the cover image
    );

    CREATE TABLE book_reviews (
        review_id SERIAL PRIMARY KEY,
        book_id INTEGER REFERENCES books(book_id),
        summary_text TEXT,
        highlight_text TEXT[]
    );

    -- populate first entry
    INSERT INTO books (title, author, isbn, language, finished_month_year)
    VALUES ('A Tale for the Time Being', 'Ruth Ozeki', '9780143124870', 'English', 'June 2024');

    INSERT INTO book_reviews (book_id, summary_text, highlight_text)
    VALUES 
    (1, 
    'A story that alternates between a Japanese schoolgirl, Nao, and a Canadian author, Ruth. Ruth finds Nao\'s diary washed up on the shore where she lives and presumes the 2011 Tōhoku tsunami is what brought the diary to her. The story unfolds with Ruth becoming absorbed, page by page, in finding out what ultimately happened to Nao, as Nao pours out her difficult life through the diary. What initially intrigued me was whether the tsunami really connected Nao\'s life to Ruth through the diary. However, I found myself not in a hurry to uncover the truth. Instead, I paced slowly with Nao\'s tale. It\'s heartbreaking as Nao shares her life spanning three generations: her suicidal father, her Buddhist nun great-grandmother, and her deceased kamikaze grand-uncle. She recounts the bullying and harassment she endures every day in a teen\'s language, as if it were normal reality to her. The opening of the book was, "Hi! My name is Nao, and I am a time being." From
