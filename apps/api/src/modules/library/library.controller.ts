import { Request, Response } from 'express';
import { LibraryService } from './library.service.js';

import { StorageService } from '../../lib/storage.js';
import { LibraryItemType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export class LibraryController {
  /**
   * FOLDERS
   */
  static async getFolders(req: Request, res: Response) {
    const parentId = (req.query.parentId as string) || null;
    const folders = await LibraryService.getFolders(req.tenantId!, parentId);
    res.json({ success: true, data: folders });
  }

  static async createFolder(req: Request, res: Response) {
    const folder = await LibraryService.createFolder({
      tenantId: req.tenantId!,
      name: req.body.name,
      parentId: req.body.parentId || null,
      createdBy: req.auth!.userId,
    });
    res.status(201).json({ success: true, data: folder });
  }

  static async updateFolder(req: Request, res: Response) {
    const folder = await LibraryService.updateFolder(req.tenantId!, req.params.id as string, req.body.name);
    res.json({ success: true, data: folder });
  }

  static async deleteFolder(req: Request, res: Response) {
    await LibraryService.deleteFolder(req.tenantId!, req.params.id as string);
    res.status(204).send();
  }

  /**
   * ITEMS
   */
  static async getItems(req: Request, res: Response) {
    const folderId = (req.query.folderId as string) || null;
    const type = req.query.type as LibraryItemType | undefined;
    const items = await LibraryService.getItems(req.tenantId!, folderId, type);
    res.json({ success: true, data: items });
  }

  static async getPinnedAnnouncements(req: Request, res: Response) {
    const items = await LibraryService.getPinnedAnnouncements(req.tenantId!);
    res.json({ success: true, data: items });
  }

  static async createArticle(req: Request, res: Response) {
    const item = await LibraryService.createArticle({
      tenantId: req.tenantId!,
      createdBy: req.auth!.userId,
      title: req.body.title,
      content: req.body.content,
      type: req.body.type || LibraryItemType.ARTICLE,
      folderId: req.body.folderId || null,
      tags: req.body.tags || [],
      isPinned: req.body.isPinned || false,
    });
    res.status(201).json({ success: true, data: item });
  }

  static async updateItem(req: Request, res: Response) {
    const item = await LibraryService.updateArticle(req.tenantId!, req.params.id as string, req.body);
    res.json({ success: true, data: item });
  }

  static async deleteItem(req: Request, res: Response) {
    await LibraryService.deleteItem(req.tenantId!, req.params.id as string);
    res.status(204).send();
  }

  /**
   * FILE UPLOAD
   */
  static async uploadFile(req: Request, res: Response) {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: 'No file uploaded', code: 'BAD_REQUEST' } });
    }

    const { folderId } = req.body;
    const extension = path.extname(req.file.originalname);
    const filename = `${uuidv4()}${extension}`;
    const key = StorageService.buildKey({
      tenantId: req.tenantId!,
      module: 'library',
      filename,
    });

    await StorageService.upload({
      key,
      body: req.file.buffer,
      contentType: req.file.mimetype,
      isPublic: false,
    });

    const fileUrl = await StorageService.getSignedUrl(key);

    const item = await prisma.libraryItem.create({
      data: {
        tenantId: req.tenantId!,
        folderId: folderId || null,
        type: LibraryItemType.FILE,
        title: req.file.originalname,
        fileKey: key,
        fileUrl, 
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        createdBy: req.auth!.userId,
      }
    });

    res.status(201).json({ success: true, data: item });
  }
}
