import * as z from 'zod';

const nullableNumber = <T extends z.ZodTypeAny>(schema: T) =>
    z.preprocess((val) => {
        if (val === '' || val === null || val === undefined) return null;
        return val;
    }, schema.nullable());

export const mulchRequestSchema = z.object({
    id: z.coerce.number().int().positive().optional(),
    amountPreference: z.enum(['FULL', 'HALF', 'ANY']).default('ANY'),
    username: z.string().min(3).max(50).trim(),
    phone: z.string().min(10, { message: 'Invalid phone number' }).trim(),
    address: z.string().min(3, { message: 'Invalid address' }).trim(),
    latitude: nullableNumber(z.coerce.number().min(-90).max(90)).default(null),
    longitude: nullableNumber(z.coerce.number().min(-180).max(180)).default(null),
    photoUrl: z.string().nullable().default(null).optional(),
    instruction: z.string().trim().nullable().optional().default(null),
    status: z.enum(['PENDING', 'DECLINED', 'APPROVED']).optional().default('PENDING'),
    scheduledData: z.iso.date().optional().nullable().default(null),
    scheduledTime: z.iso.time().optional().nullable().default(null)
    // userId: z.coerce.number().int().positive().optional()
});

export type CreateMulchRequestDto = z.infer<typeof mulchRequestSchema>;
