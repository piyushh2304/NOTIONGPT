import express from 'express';
import { protect } from '../middleware/auth';
import {
    createDocument,
    getDocuments,
    getDocument,
    updateDocument,
    archiveDocument,
    searchDocuments,
    getPublicDocument
} from '../controllers/documentController';

const router = express.Router();

router.get('/public/:id', getPublicDocument);

router.use(protect);

router.route('/')
    .post(createDocument)
    .get(getDocuments);

router.route('/:id')
    .get(getDocument)
    .put(updateDocument)
    .delete(archiveDocument);

router.post('/search', searchDocuments);

export default router;