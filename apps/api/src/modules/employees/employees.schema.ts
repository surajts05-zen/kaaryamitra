import { z } from 'zod';
import { Gender, EmploymentType, EmploymentStatus } from '@prisma/client';

export const createEmployeeSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    employeeCode: z.string().optional().nullable(),
    dateOfBirth: z.string().optional().nullable(),
    gender: z.nativeEnum(Gender).optional().nullable(),
    nationality: z.string().optional().nullable(),
    maritalStatus: z.string().optional().nullable(),
    personalEmail: z.string().email('Invalid personal email format').optional().nullable().or(z.literal('')),
    phone: z.string().optional().nullable(),
    avatarUrl: z.string().optional().nullable(),

    workEmail: z.string().email('Invalid work email format'),
    departmentId: z.string().optional().nullable(),
    teamId: z.string().optional().nullable(),
    locationId: z.string().optional().nullable(),
    designationId: z.string().optional().nullable(),
    jobLevelId: z.string().optional().nullable(),
    managerId: z.string().optional().nullable(),
    employmentType: z.nativeEnum(EmploymentType).optional(),
    employmentStatus: z.nativeEnum(EmploymentStatus).optional(),
    joiningDate: z.string().optional(),
    confirmationDate: z.string().optional().nullable(),
    probationEndDate: z.string().optional().nullable(),
    roleId: z.string().optional().nullable(),
  }),
});

export const updateEmployeeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: createEmployeeSchema.shape.body.partial(),
});
