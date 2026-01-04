import express from 'express';
import { chatWithDocs, getMyChats, getChatHistory, deleteChat, generateLearningContent } from '../controllers/aiController';

const router = express.Router();

router.post('/chat', chatWithDocs);
router.post('/generate-learning', generateLearningContent);
router.get('/chats', getMyChats);
router.get('/chats/:id', getChatHistory);
router.delete('/chats/:id', deleteChat);

export default router;
