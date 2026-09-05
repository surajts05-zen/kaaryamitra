import { Request, Response } from 'express';
import { PoliciesService } from './policies.service.js';
import {
  createPolicyCategorySchema,
  updatePolicyCategorySchema,
  createPolicySchema,
  updatePolicySchema,
  updatePolicyVersionSchema
} from './policies.schema.js';
import { AppError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';

export class PoliciesController {
  // Categories
  static async getCategories(req: Request, res: Response) {
    const categories = await PoliciesService.getCategories(req.tenantId!);
    res.json(categories);
  }

  static async createCategory(req: Request, res: Response) {
    const data = createPolicyCategorySchema.parse(req.body);
    const category = await PoliciesService.createCategory(req.tenantId!, data);
    res.status(201).json(category);
  }

  static async updateCategory(req: Request, res: Response) {
    const id = req.params['id'] as string;
    const data = updatePolicyCategorySchema.parse(req.body);
    const category = await PoliciesService.updateCategory(req.tenantId!, id, data);
    res.json(category);
  }

  static async deleteCategory(req: Request, res: Response) {
    const id = req.params['id'] as string;
    await PoliciesService.deleteCategory(req.tenantId!, id);
    res.status(204).send();
  }

  // Policies
  static async getPolicies(req: Request, res: Response) {
    const policies = await PoliciesService.getPolicies(req.tenantId!);
    res.json(policies);
  }

  static async getPolicy(req: Request, res: Response) {
    const id = req.params['id'] as string;
    const policy = await PoliciesService.getPolicyById(req.tenantId!, id);
    res.json(policy);
  }

  static async createPolicy(req: Request, res: Response) {
    const data = createPolicySchema.parse(req.body);
    const policy = await PoliciesService.createPolicy(req.tenantId!, data);
    res.status(201).json(policy);
  }

  static async updatePolicy(req: Request, res: Response) {
    const id = req.params['id'] as string;
    const data = updatePolicySchema.parse(req.body);
    const policy = await PoliciesService.updatePolicy(req.tenantId!, id, data);
    res.json(policy);
  }

  // Versions
  static async createDraftVersion(req: Request, res: Response) {
    const id = req.params['id'] as string;
    const version = await PoliciesService.createDraftVersion(req.tenantId!, id);
    res.status(201).json(version);
  }

  static async getVersion(req: Request, res: Response) {
    const id = req.params['id'] as string;
    const versionId = req.params['versionId'] as string;
    const version = await PoliciesService.getVersionById(req.tenantId!, id, versionId);
    res.json(version);
  }

  static async saveDraftVersion(req: Request, res: Response) {
    const id = req.params['id'] as string;
    const versionId = req.params['versionId'] as string;
    const data = updatePolicyVersionSchema.parse(req.body);
    const version = await PoliciesService.saveDraftVersion(req.tenantId!, id, versionId, data);
    res.json(version);
  }

  static async submitForReview(req: Request, res: Response) {
    const id = req.params['id'] as string;
    const versionId = req.params['versionId'] as string;
    const version = await PoliciesService.submitForReview(req.tenantId!, id, versionId);
    res.json(version);
  }

  static async publishVersion(req: Request, res: Response) {
    const id = req.params['id'] as string;
    const versionId = req.params['versionId'] as string;
    const userId = req.auth!.userId;
    const version = await PoliciesService.publishVersion(req.tenantId!, id, versionId, userId);
    res.json(version);
  }

  static async getVersionAcknowledgements(req: Request, res: Response) {
    const id = req.params['id'] as string;
    const versionId = req.params['versionId'] as string;
    const acks = await PoliciesService.getVersionAcknowledgements(req.tenantId!, id, versionId);
    res.json(acks);
  }

  // ESS
  static async getMyPolicies(req: Request, res: Response) {
    const userId = req.auth!.userId;
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw AppError.notFound('Employee profile not found');
    const policies = await PoliciesService.getMyPolicies(req.tenantId!, employee.id);
    res.json(policies);
  }

  static async acknowledgePolicy(req: Request, res: Response) {
    const userId = req.auth!.userId;
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw AppError.notFound('Employee profile not found');
    const versionId = req.params['versionId'] as string;
    const ack = await PoliciesService.acknowledgePolicy(req.tenantId!, employee.id, versionId);
    res.json(ack);
  }

  // Templates & AI
  static async seedTemplates(req: Request, res: Response) {
    const result = await PoliciesService.seedStandardPoliciesForTenant(req.tenantId!);
    res.json(result);
  }

  static async aiGenerate(req: Request, res: Response) {
    const { prompt } = req.body;
    if (!prompt) throw AppError.badRequest('Prompt is required');
    const { generatePolicyBlocks } = await import('../ai/ai.service.js');
    const result = await generatePolicyBlocks(req.tenantId!, prompt);
    if (!result) throw AppError.badRequest('Failed to generate policy content via AI.');
    res.json(result);
  }

  static async aiRefine(req: Request, res: Response) {
    const { text, instruction } = req.body;
    if (!text || !instruction) throw AppError.badRequest('Text and instruction are required');
    const { refinePolicyText } = await import('../ai/ai.service.js');
    const result = await refinePolicyText(req.tenantId!, text, instruction);
    res.json({ text: result });
  }

  static async aiSummarize(req: Request, res: Response) {
    const { blocks } = req.body;
    if (!blocks || !Array.isArray(blocks)) throw AppError.badRequest('Blocks array is required');
    const { summarizePolicy } = await import('../ai/ai.service.js');
    const summary = await summarizePolicy(req.tenantId!, blocks);
    res.json({ summary });
  }

  static async aiGenerateFAQ(req: Request, res: Response) {
    const { blocks } = req.body;
    if (!blocks || !Array.isArray(blocks)) throw AppError.badRequest('Blocks array is required');
    const { generatePolicyFAQ } = await import('../ai/ai.service.js');
    const faq = await generatePolicyFAQ(req.tenantId!, blocks);
    res.json({ faq });
  }

  static async aiCompare(req: Request, res: Response) {
    const { oldBlocks, newBlocks } = req.body;
    if (!oldBlocks || !newBlocks) throw AppError.badRequest('oldBlocks and newBlocks are required');
    const { comparePolicyVersions } = await import('../ai/ai.service.js');
    const changes = await comparePolicyVersions(req.tenantId!, oldBlocks, newBlocks);
    res.json({ changes });
  }

  static async aiDraftComm(req: Request, res: Response) {
    const { policyName, summary } = req.body;
    if (!policyName || !summary) throw AppError.badRequest('policyName and summary are required');
    const { draftEmployeeCommunication } = await import('../ai/ai.service.js');
    const draft = await draftEmployeeCommunication(req.tenantId!, policyName, summary);
    res.json({ draft });
  }
}


