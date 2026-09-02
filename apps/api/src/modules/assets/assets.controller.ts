import { Request, Response } from 'express';
import { AssetsService } from './assets.service.js';

export const listCategoriesHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const categories = await AssetsService.listCategories(tenantId);
  res.json({ success: true, data: categories });
};

export const createCategoryHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const { name } = req.body;
  const category = await AssetsService.createCategory(tenantId, name);
  res.json({ success: true, data: category });
};

export const deleteCategoryHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const id = req.params['id'] as string;
  await AssetsService.deleteCategory(tenantId, id);
  res.json({ success: true });
};

export const listAssetsHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const assets = await AssetsService.listAssets(tenantId);
  res.json({ success: true, data: assets });
};

export const createAssetHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const asset = await AssetsService.createAsset(tenantId, req.body);
  res.json({ success: true, data: asset });
};

export const updateAssetHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const id = req.params['id'] as string;
  const asset = await AssetsService.updateAsset(tenantId, id, req.body);
  res.json({ success: true, data: asset });
};

export const deleteAssetHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const id = req.params['id'] as string;
  await AssetsService.deleteAsset(tenantId, id);
  res.json({ success: true });
};

export const assignAssetHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const id = req.params['id'] as string;
  const { employeeId } = req.body;
  
  if (employeeId) {
    const asset = await AssetsService.assignAsset(tenantId, id, employeeId);
    res.json({ success: true, data: asset });
  } else {
    const asset = await AssetsService.unassignAsset(tenantId, id);
    res.json({ success: true, data: asset });
  }
};

export const listEmployeeAssetsHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const employeeId = req.params['employeeId'] as string;
  const assets = await AssetsService.listEmployeeAssets(tenantId, employeeId);
  res.json({ success: true, data: assets });
};

