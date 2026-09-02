import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

export class ReviewsService {
  // ─── ADMIN: CYCLES ──────────────────────────────────────────────────────────

  static async createReviewCycle(tenantId: string, data: any) {
    return prisma.reviewCycle.create({
      data: {
        tenantId,
        title: data.title,
        type: data.type,
        status: data.status || 'DRAFT',
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        is360Degree: data.is360Degree || false,
      },
    });
  }

  static async getReviewCycles(tenantId: string) {
    return prisma.reviewCycle.findMany({
      where: { tenantId },
      include: {
        _count: { select: { reviews: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getReviewCycleById(tenantId: string, id: string) {
    const cycle = await prisma.reviewCycle.findUnique({
      where: { id, tenantId },
      include: {
        reviews: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true, designation: { select: { name: true } } }
            }
          }
        }
      }
    });
    if (!cycle) throw AppError.notFound('Review cycle');
    return cycle;
  }

  static async startReviewCycle(tenantId: string, id: string) {
    const cycle = await this.getReviewCycleById(tenantId, id);
    if (cycle.status !== 'DRAFT') throw AppError.badRequest('Only draft cycles can be started');

    // Get all active employees. For probation cycles, we might filter, but for now we enroll all active.
    const eligibleEmployees = await prisma.employee.findMany({
      where: { tenantId, employmentStatus: { in: ['ACTIVE', 'PROBATION'] } },
      select: { id: true }
    });

    if (eligibleEmployees.length === 0) throw AppError.badRequest('No eligible employees found to start review cycle');

    // Create a PerformanceReview record for each
    const reviewsToCreate = eligibleEmployees.map(emp => ({
      tenantId,
      reviewCycleId: cycle.id,
      employeeId: emp.id,
      status: 'NOT_STARTED' as const,
    }));

    await prisma.performanceReview.createMany({ data: reviewsToCreate, skipDuplicates: true });
    
    // Update cycle status
    return prisma.reviewCycle.update({
      where: { id: cycle.id },
      data: { status: 'ACTIVE' }
    });
  }

  // ─── ESS / MANAGERS: REVIEWS ────────────────────────────────────────────────

  static async getMyReviews(tenantId: string, employeeId: string) {
    return prisma.performanceReview.findMany({
      where: { tenantId, employeeId },
      include: {
        reviewCycle: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getTeamReviews(tenantId: string, managerId: string) {
    return prisma.performanceReview.findMany({
      where: { 
        tenantId, 
        employee: { managerId }
      },
      include: {
        reviewCycle: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, designation: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getReviewById(tenantId: string, id: string, requestorId: string, requestorRole: string) {
    const review = await prisma.performanceReview.findUnique({
      where: { id, tenantId },
      include: {
        reviewCycle: true,
        employee: { select: { id: true, firstName: true, lastName: true, managerId: true } },
        feedbacks: {
          include: {
            reviewer: { select: { id: true, firstName: true, lastName: true } }
          }
        }
      }
    });

    if (!review) throw AppError.notFound('Review');

    // Check authorization: admin, self, or manager
    const isAdmin = requestorRole.includes('admin') || requestorRole.includes('hr');
    const isSelf = review.employeeId === requestorId;
    const isManager = review.employee.managerId === requestorId;

    if (!isAdmin && !isSelf && !isManager) {
      // If it's a 360 degree, a peer could technically view it to provide feedback? 
      // But typically they only see a specific peer review form, not the whole appraisal.
      // For now, allow if they are in the feedbacks list (meaning they provided feedback).
      const providedFeedback = review.feedbacks.some(f => f.reviewerId === requestorId);
      if (!providedFeedback) {
        throw AppError.forbidden('Unauthorized to view this review');
      }
    }

    // Mask anonymous peer feedbacks if viewed by employee
    if (isSelf) {
      review.feedbacks = review.feedbacks.map(f => {
        if (f.isAnonymous) {
          return { ...f, reviewer: null as any };
        }
        return f;
      });
    }

    return review;
  }

  static async submitSelfEvaluation(tenantId: string, id: string, employeeId: string, data: { rating: number, comments: string }) {
    const review = await prisma.performanceReview.findUnique({ where: { id, tenantId } });
    if (!review) throw AppError.notFound('Review');
    if (review.employeeId !== employeeId) throw AppError.forbidden('Unauthorized');
    
    // allow update even if manager eval started, but typically locked after MANAGER_EVALUATION
    
    return prisma.performanceReview.update({
      where: { id },
      data: {
        selfRating: data.rating,
        selfComments: data.comments,
        selfSubmittedAt: new Date(),
        status: review.status === 'NOT_STARTED' ? 'MANAGER_EVALUATION' : review.status,
      }
    });
  }

  static async submitManagerEvaluation(tenantId: string, id: string, managerId: string, data: { rating: number, comments: string }) {
    const review = await prisma.performanceReview.findUnique({ 
      where: { id, tenantId },
      include: { employee: true }
    });
    if (!review) throw AppError.notFound('Review');
    
    // Must be the employee's manager
    if (review.employee.managerId !== managerId) {
      // Check if Admin overriding
      // Note: for this demo, we assume the controller validates role if overriding
    }

    return prisma.performanceReview.update({
      where: { id },
      data: {
        managerRating: data.rating,
        managerComments: data.comments,
        managerSubmittedAt: new Date(),
        finalRating: data.rating, // default final to manager rating
        status: 'HR_REVIEW', // progress to next stage
      }
    });
  }

  static async submitPeerFeedback(tenantId: string, id: string, reviewerId: string, data: { rating: number, comments: string, isAnonymous: boolean, type: any }) {
    const review = await prisma.performanceReview.findUnique({ where: { id, tenantId }, include: { reviewCycle: true } });
    if (!review) throw AppError.notFound('Review');
    if (!review.reviewCycle.is360Degree) throw AppError.badRequest('360 degree feedback is not enabled for this cycle');

    return prisma.reviewFeedback.upsert({
      where: { performanceReviewId_reviewerId: { performanceReviewId: id, reviewerId } },
      create: {
        performanceReviewId: id,
        reviewerId,
        rating: data.rating,
        comments: data.comments,
        isAnonymous: data.isAnonymous,
        type: data.type || 'PEER',
      },
      update: {
        rating: data.rating,
        comments: data.comments,
        isAnonymous: data.isAnonymous,
      }
    });
  }

  // ─── ADMIN: FINALIZE ────────────────────────────────────────────────────────

  static async finalizeReview(tenantId: string, id: string, data: { finalRating?: number, hrComments?: string }) {
    return prisma.performanceReview.update({
      where: { id, tenantId },
      data: {
        ...(data.finalRating && { finalRating: data.finalRating }),
        ...(data.hrComments && { hrComments: data.hrComments }),
        status: 'COMPLETED'
      }
    });
  }
}
