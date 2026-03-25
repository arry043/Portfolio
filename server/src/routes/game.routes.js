import express from 'express';
import { listGames } from '../controllers/game.controller.js';

const router = express.Router();

router.get('/', listGames);

export default router;
