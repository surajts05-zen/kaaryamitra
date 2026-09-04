import { Router } from 'express';
import { LibraryController } from './library.controller.js';
import multer from 'multer';
import { requirePermission } from '../../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// FOLDERS
router.get('/folders', LibraryController.getFolders);
router.post('/folders', requirePermission('org:manage'), LibraryController.createFolder);
router.put('/folders/:id', requirePermission('org:manage'), LibraryController.updateFolder);
router.delete('/folders/:id', requirePermission('org:manage'), LibraryController.deleteFolder);

// ITEMS (Files, Articles, Announcements)
router.get('/items', LibraryController.getItems);
router.get('/announcements/pinned', LibraryController.getPinnedAnnouncements);

router.post('/articles', requirePermission('org:manage'), LibraryController.createArticle);
router.put('/items/:id', requirePermission('org:manage'), LibraryController.updateItem);
router.delete('/items/:id', requirePermission('org:manage'), LibraryController.deleteItem);

// FILE UPLOAD
router.post('/upload', requirePermission('org:manage'), upload.single('file'), LibraryController.uploadFile);

export const libraryRouter = router;
