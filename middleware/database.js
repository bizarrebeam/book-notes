import { connectDatabase, dbConnected } from '../config/database.js';

const databaseMiddleware = async (req, res, next) => {
  try {
    if (!dbConnected) {
      await connectDatabase(); 
    }
    next();
  } catch (err) {
    // handle the "already been connected" 
    if (err.message.includes('already been connected')) {
      dbConnected = true;
      next(); 
    } else {
      console.error("middleware database error:", err);
      res.status(500).send(`database error: ${err.message}`);
    }
  }
};

export default databaseMiddleware;
