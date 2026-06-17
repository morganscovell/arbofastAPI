import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import * as profileRepo from '../repositories/profile';
import { ApiResponse } from '../helper/api-response';
import { AppError } from '../error/app-error';
import { UpdateUserDto, ChangePasswordDto, NewAddressDto } from '../validators';

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const body: UpdateUserDto = req.body;
        const user: IAuthenticatedUser = req.user!;

        const photo = req.file ? req.file.filename : body?.photoUrl || null;

        const updated = await profileRepo.updateProfile({ ...body, id: user.id, photo });

        if (!updated) throw new AppError(400, 'Invalid Update Profile Request', 'Failed to update the profile. The user may not exist or an unexpected error occurred.');

        return ApiResponse(res, 200, { ...body, photo }, 'Profile updated successfully.');
    } catch (error) {
        return next(error);
    }
}

export async function addNewAddress(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const body: NewAddressDto = req.body;
        const user: IAuthenticatedUser = req.user!;

        const id = await profileRepo.newAddress({ ...body, userId: user.id });

        return ApiResponse(res, 201, { id, ...body, isDefault: false, userId: user.id }, 'Address added successfully.');
    } catch (error) {
        return next(error);
    }
}

export async function makeAddressDefault(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const id = Number(req.params.id);
        if (!id) throw new AppError(400, 'Invalid Default Address Request', 'Invalid address id.');

        const user: IAuthenticatedUser = req.user!;

        await profileRepo.defaultAddress(id, user.id);

        return ApiResponse(res, 200, id, 'Address set as default successfully.');
    } catch (error) {
        return next(error);
    }
}

export async function deleteAddress(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const id = Number(req.params.id);
        if (!id) throw new AppError(400, 'Invalid Delete Address Request', 'Invalid address id.');

        const deleted = await profileRepo.deleteAddress(id);

        if (!deleted)
            throw new AppError(
                400,
                'Invalid Address Delete Request',
                'Failed to delete the address. The address may not exist, may be set as the default address, or an unexpected error occurred.'
            );

        return ApiResponse(res, 200, { id }, 'Address delete successfully.');
    } catch (error) {
        return next(error);
    }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const body: ChangePasswordDto = req.body;
        const user: IAuthenticatedUser = req.user!;

        const matched: boolean = await bcrypt.compare(body.currentPassword as string, user?.password as string);

        if (!matched) throw new AppError(401, 'Invalid Change Password Attempt', 'User is not authenticated in order to change password.');

        const salt: string = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT_ROUNDS));
        const hash: string = await bcrypt.hash(body.confirmPassword as string, salt);

        await profileRepo.updatePassword(hash, user.id);

        return ApiResponse(res, 200, null, "User's password changed successfully.");
    } catch (error) {
        return next(error);
    }
}
