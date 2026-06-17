import * as z from 'zod';
import parsePhoneNumber, { PhoneNumber } from 'libphonenumber-js';

export const updateUserSchema = z
    .object({
        username: z.string().min(3).max(20).trim(),
        phone: z.string().trim(),
        photoUrl: z.string().trim().optional().nullable().default(null)
    })
    .refine(
        (data) => {
            if (data.phone) {
                const phone: PhoneNumber | undefined = parsePhoneNumber(data.phone);
                return phone?.isValid() ?? false;
            }
            return true;
        },
        { path: ['phone'], message: 'Invalid phone number' }
    );

export const newAddressSchema = z.object({
    address: z.string().min(3).trim(),
    type: z.string().min(3).max(15).trim()
});

export const changePasswordSchema = z
    .object({
        currentPassword: z.string(),
        newPassword: z.string(),
        confirmPassword: z.string()
    })
    .refine((data) => !(data.newPassword.length < 8 || data.newPassword.length > 15), {
        message: 'Password length should be between 8-15 characters',
        path: ['passwordLength']
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Password should match confirm password',
        path: ['passwordNotMatched']
    });

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type NewAddressDto = z.infer<typeof newAddressSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
