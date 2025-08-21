import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import path from 'path';
import databaseMiddleware from '../middleware/database.js';
import { checkAdminStatus } from '../middleware/auth.js';
import { serveStaticCSS, serveStaticAssets } from '../utils/static.js';

/**
 * configure express app with middleware and settings
 * @returns {express.Application} configured express app
 */
export function configureApp() {
  const app = express();

  // view engine
  app.set('view engine', 'ejs');
  const viewsPath = path.join(process.cwd(), 'views');
  console.log('Views path set to:', viewsPath);
  console.log('Current working directory:', process.cwd());
  app.set('views', viewsPath);

  // middleware
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());
  
  // check admin status on every request
  app.use(checkAdminStatus);
  
  // static files
  app.use(express.static("public", {
    maxAge: '1d',
    etag: true
  }));
  
  // database connection
  app.use(databaseMiddleware);

  // explicitly serve css and assets
  app.get('/styles/output.css', serveStaticCSS);
  app.get('/assets/:filename', serveStaticAssets);

  return app;
}
