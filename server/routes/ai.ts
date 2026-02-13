import express from 'express';
import { chatWithDocs, getMyChats, getChatHistory, deleteChat, generateLearningContent, analogySearch, detectContradictions, workspaceSummary, editContent, autocompleteContent, generateContent } from '../controllers/aiController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/chat', protect, chatWithDocs);
router.post('/analogy-search', protect, analogySearch);
router.post('/detect-contradictions', protect, detectContradictions);
router.post('/workspace-summary', protect, workspaceSummary);
router.post('/generate-learning', protect, generateLearningContent);
router.get('/chats', protect, getMyChats);
router.get('/chats/:id', protect, getChatHistory);
router.delete('/chats/:id', protect, deleteChat);
router.post('/edit', protect, editContent);
router.post('/autocomplete', protect, autocompleteContent);
router.post('/generate', protect, generateContent);

export default router;
