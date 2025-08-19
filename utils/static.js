import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// get parent directory (project root)
const projectRoot = path.dirname(__dirname);

const serveStaticCSS = (req, res) => {
  res.sendFile(path.join(projectRoot, 'public', 'styles', 'output.css'));
};

const serveStaticAssets = (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(projectRoot, 'public', 'assets', filename);
  res.sendFile(filepath);
};

export { serveStaticCSS, serveStaticAssets, projectRoot };
