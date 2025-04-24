import express from 'express';
import passport from '../middlewares/passport.js';
import fetchLatestVersion from '../utils/checkAppVersion.js';

const router = express.Router();

// Ruta para leer la version de la app
// API Route to Check Version
router.get("/latest-version", async (req, res) => {
    const latestVersion = await fetchLatestVersion();
    res.json({ latestVersion });
  });

export default router;
