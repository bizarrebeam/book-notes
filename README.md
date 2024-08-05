# A Collection of Adelya's Reading

Welcome to my book notes web application! This is a collection of my reading notes--I summarize books and highlight sentences that resonate with me the most. I started this project as part of my capstone to learn about databases. This website is heavily influenced by [Derek Sivers's book notes!](https://sive.rs/book)

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
    git clone https://github.com/bizarrebeam/book-notes.git
    cd book-notes-web-app
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Set up the database:**

    Open your PostgreSQL client and run the following queries (or simply copy from `queries.sql`) to create the necessary tables and populate the initial data:

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
    'A story that alternates between a Japanese schoolgirl, Nao, and a Canadian author, Ruth. Ruth finds Nao\'s diary washed up on the shore where she lives and presumes the 2011 Tōhoku tsunami is what brought the diary to her. The story unfolds with Ruth becoming absorbed, page by page, in finding out what ultimately happened to Nao, as Nao pours out her difficult life through the diary. What initially intrigued me was whether the tsunami really connected Nao\'s life to Ruth through the diary. However, I found myself not in a hurry to uncover the truth. Instead, I paced slowly with Nao\'s tale. It\'s heartbreaking as Nao shares her life spanning three generations: her suicidal father, her Buddhist nun great-grandmother, and her deceased kamikaze grand-uncle. She recounts the bullying and harassment she endures every day in a teen\'s language, as if it were normal reality to her. The opening of the book was, "Hi! My name is Nao, and I am a time being." From that point on, I positioned myself as Ruth, slowly uncovering the pages without haste, and allowing myself to be a time being—whether present or past—connected with Nao\'s time.', 
    ARRAY[
        'Or maybe none of these things will happen except in my mind and yours, because, like I told you, together we’re making magic, at least for the time being.', 
        'Do not think that time simply flies away. Do not understand “flying” as the only function of time. If time simply flew away, a separation would exist between you and time. So if you understand time as only passing, then you do not understand the time being. To grasp this truly, every being that exists in the entire world is linked together as moments in time, and at the same time they exist as individual moments of time. Because all moments are the time being, they are your time being.',
        'What if I travel so far away in my dream that I can’t get back in time to wake up?',
        'As I have not much time left in life, I am determined not to be a coward. I will live as earnestly as I can and feel my feelings deeply. I will rigorously reflect upon my thoughts and emotions, and try to improve myself as much as I can.'
    ]
    );
    ```

4. **Configure the database connection:**

    Open the `index.js` file and update the database connection details to match your local setup:

    ```javascript
    const db = new pg.Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });
    db.connect();
    ```

5. **Run the application:**

    ```bash
    npm run dev:all
    ```

6. **Access the application:**

    Open your web browser and goto [http://localhost:3000](http://localhost:3000) to see the application running locally.

That's it!  

---
