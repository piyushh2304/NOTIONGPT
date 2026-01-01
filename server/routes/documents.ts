import express from 'express';
import { protect } from '../middleware/auth';
import {
    createDocument,
    getDocuments,
    getDocument,
    updateDocument,
    archiveDocument
} from '../controllers/documentController';

const router = express.Router();

router.use(protect);

router.route('/')
    .post(createDocument)
    .get(getDocuments);

router.route('/:id')
    .get(getDocument)
    .put(updateDocument)
    .delete(archiveDocument);

export default router;