import * as z from 'zod';
import parsePhoneNumber, { PhoneNumber } from 'libphonenumber-js';

export const signupSchema = z
    .object({
        username: z.string().min(3).max(20).trim(),
        email: z.email(),
        password: z.string().trim(),
        phone: z.string().trim(),
        address: z.string().min(1).trim()
    })
    .refine((data) => !(data.password.length < 8 || data.password.length > 15), {
        message: 'Password length should be between 8-15 characters',
        path: ['passwordLength']
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

export const signinSchema = z
    .object({
        email: z.email(),
        password: z.string()
    })
    .refine((data) => !(data.password.length < 8 || data.password.length > 15), {
        message: 'Password length should be between 8-15 characters',
        path: ['passwordLength']
    });

export type SignUpDto = z.infer<typeof signupSchema>;
export type SignInDto = z.infer<typeof signinSchema>;
