import { z } from 'zod';
import { Gender, EmploymentType, EmploymentStatus } from '@prisma/client';

export const createEmployeeSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    employeeCode: z.string().optional(),
    dateOfBirth: z.string().optional(), // Expected ISO string
    gender: z.nativeEnum(Gender).optional(),
    nationality: z.string().optional(),
    maritalStatus: z.string().optional(),
    personalEmail: z.string().email('Invalid personal email format').optional().or(z.literal('')),
    phone: z.string().optional(),

    workEmail: z.string().email('Invalid work email format'),
    departmentId: z.string().optional(),
    teamId: z.string().optional(),
    locationId: z.string().optional(),
    designationId: z.string().optional(),
    jobLevelId: z.string().optional(),
    managerId: z.string().optional(),
    employmentType: z.nativeEnum(EmploymentType).default('FULL_TIME'),
    employmentStatus: z.nativeEnum(EmploymentStatus).default('PROBATION'),
    joiningDate: z.string(), // Expected ISO string
    confirmationDate: z.string().optional(),
    probationEndDate: z.string().optional(),
  }),
});

export const updateEmployeeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: createEmployeeSchema.shape.body.partial(),
});
