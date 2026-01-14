import express from 'express';
import { performResearch } from '../controllers/researchController';

const router = express.Router();

router.post('/', performResearch);

export default router;
