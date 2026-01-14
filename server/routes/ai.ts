import express from 'express';
import { chatWithDocs, getMyChats, getChatHistory, deleteChat, generateLearningContent, analogySearch, detectContradictions, workspaceSummary } from '../controllers/aiController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/chat', protect, chatWithDocs);
router.post('/analogy-search', analogySearch);
router.post('/detect-contradictions', detectContradictions);
router.post('/workspace-summary', workspaceSummary);
router.post('/generate-learning', generateLearningContent);
router.get('/chats', getMyChats);
router.get('/chats/:id', getChatHistory);
router.delete('/chats/:id', deleteChat);

export default router;
