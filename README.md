# a collection of Adelya's reading

Welcome to my book notes web application! This is a collection of my reading notes--I summarize books and highlight sentences that resonate with me the most. I started this project as part of my capstone to learn about databases. This website is heavily influenced by [Derek Sivers's book notes!](https://sive.rs/book)

## about the project

I found myself enjoying reading during my long, first-year college break. Reading was a habit I forced on myself, but now I'm enjoying it for leisure -- even thinking each sentence from them that lingers on my mind is a waste for only keeping it with me. That was all I could think about when creating my capstone project for learning about databases. 

## project structure

```
├── index.js                    # main application entry point
├── config/
│   ├── app.js                 # express app configuration
│   └── database.js            # database connection setup
├── middleware/
│   ├── admin.js               # admin authentication functions
│   ├── auth.js                # auth status checking middleware
│   └── database.js            # database connection middleware
├── routes/
│   ├── public.js              # public routes (home, review, about)
│   ├── auth.js                # authentication routes (login, logout)
│   └── books.js               # book management routes (crud operations)
├── services/
│   ├── bookService.js         # book database operations
│   └── imageService.js        # image processing and optimization
├── utils/
│   └── static.js              # static file serving utilities
├── views/                     # ejs templates
│   ├── partials/              # shared template parts
│   ├── admin/                 # admin-specific views
│   └── *.ejs                  # page templates
└── public/                    # static assets (css, images, js)
```

## features

- **book management**: add, edit, delete book reviews
- **image optimization**: automatic cover image processing with sharp
- **admin authentication**: jwt-based admin access
- **responsive design**: tailwind css with custom color scheme
- **line break preservation**: proper text formatting in reviews
- **database**: postgresql with uuid primary keys

## routes

### public routes
- `GET /` - home page with book list
- `GET /review/:book_id` - individual book review
- `GET /about` - about page

### authentication routes
- `GET /admin/login` - admin login form
- `POST /admin/login` - handle login
- `POST /admin/logout` - handle logout

### book management routes (admin only)
- `GET /compose` - new book form
- `POST /compose` - create new book
- `GET /admin/edit/:book_id` - edit book form
- `POST /admin/update/:book_id` - update book
- `POST /admin/delete/:book_id` - delete book

## environment variables

- `DATABASE_URL` - postgresql connection string
- `ADMIN_USERNAME` - admin login username
- `ADMIN_PASSWORD_HASH` - bcrypt hashed admin password
- `JWT_SECRET` - jwt signing secret
- `NODE_ENV` - environment (production/development)

## installation

1. install dependencies: `npm install`
2. set up environment variables in `.env`
3. run database migrations: see `queries.sql`
4. build css: `npm run build`
5. start server: `npm start` or `npm run dev:all` for development

## development

- `npm run dev:all` - start both server and css watch mode
- `npm run build` - build production css
- `npm start` - start production server
