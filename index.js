import { configureApp } from './config/app.js';
import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';

// create and configure express app
const app = configureApp();
const port = process.env.PORT || 3000;

// register routes
app.use('/', publicRoutes);
app.use('/', authRoutes);
app.use('/', bookRoutes);

// start server
app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
