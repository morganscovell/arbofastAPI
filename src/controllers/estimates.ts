import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../helper/api-response';
import { AppError } from '../error/app-error';
import * as estimateRepo from '../repositories/estimates';
import { CreateEstimateDto } from '../validators';

export async function userEstimate(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const isUpdate = req.method.toLowerCase() == 'patch';
        const { id: estimateId, workItems, noteOrInstruction } = req.body;

        if (!workItems.length) throw new AppError(400, 'Invalid User Estimate Request', 'At least one work item is present in estimate request.');
        if (isUpdate && !estimateId) throw new AppError(400, 'Invalid User Estimate Request', 'Invalid estimate id.');

        const user: IAuthenticatedUser = req.user!;

        const defaultAddress = user.addresses.find((address) => address.isDefault);

        if (!defaultAddress?.address) {
            throw new AppError(
                400,
                'Invalid Estimate Request',
                'No default address found for the user. Please add and set a default address before submitting an estimate request.'
            );
        }

        if (!user.phone) {
            throw new AppError(
                400,
                'Invalid Estimate Request',
                'The user does not have a phone number associated with their account. Please add a phone number before submitting an estimate request.'
            );
        }

        const data: CreateEstimateDto = {
            ...(isUpdate && { id: Number(estimateId) }),

            username: user.username,
            email: user.email,
            phone: user.phone,
            address: defaultAddress.address,

            latitude: null,
            longitude: null,

            status: 'PENDING',
            noteOrInstruction: noteOrInstruction ?? null,
            hazards: null,
            equipmentOrCrewOptions: null,

            userId: user.id,
            workItems
        };

        if (isUpdate) {
            await estimateRepo.updateEstimate(data);
            return ApiResponse(res, 200, { id: estimateId, workItems }, 'Estimate request updated successfully.');
        }

        const id: number = await estimateRepo.saveEstimate(data);
        return ApiResponse(res, 201, { id, workItems }, 'Estimate request submitted successfully.');
    } catch (error) {
        return next(error);
    }
}

export async function adminEstimate(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const isUpdate = req.method.toLowerCase() == 'put';
        const body: CreateEstimateDto = req.body;

        if (isUpdate && !body.id) throw new AppError(400, 'Invalid User Estimate Request', 'Invalid estimate id.');

        if (isUpdate) {
            await estimateRepo.updateEstimate(body);
            return ApiResponse(res, 201, body, 'Estimate request updated successfully.');
        }

        const id: number = await estimateRepo.saveEstimate(body);
        return ApiResponse(res, 201, { id, ...body }, 'Estimate request submitted successfully.');
    } catch (error) {
        return next(error);
    }
}

export async function getUserEstimates(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const user: IAuthenticatedUser = req.user!;
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

        const { data, total } = await estimateRepo.getAllEstimates({ page, limit, userId: user.id, userEmail: user.email });

        const payload = {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };

        return ApiResponse(res, 200, payload, 'Estimates fetched successfully.');
    } catch (error) {
        return next(error);
    }
}

export async function getEstimateById(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const estimateId = Number(req.params.id);
        if (!estimateId || Number.isNaN(estimateId)) throw new AppError(400, 'Invalid Get Estimate Request', 'Invalid estimate id.');

        const estimate = await estimateRepo.getEstimateById(estimateId);
        if (!estimate) throw new AppError(400, 'Invalid Get Estimate Request', 'Estimate not found.');

        return ApiResponse(res, 200, estimate, 'Estimate fetched successfully.');
    } catch (error) {
        return next(error);
    }
}

export async function getAdminEstimates(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

        const { data, total } = await estimateRepo.getAllEstimates({ page, limit });

        const payload = {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };

        return ApiResponse(res, 200, payload, 'Estimates fetched successfully.');
    } catch (error) {
        return next(error);
    }
}

export async function updateEstimateStatus(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const id: number = Number(req.params.id);
        const status: EstimateStatus | undefined = req.params.status as EstimateStatus | undefined;

        const STATUS: EstimateStatus[] = ['PENDING', 'ACCEPTED', 'SENT_TO_QUICKBOOK', 'DRAFT', 'APPROVED'];

        if (!id) throw new AppError(400, 'Invalid Estimate Status Request', 'Invalid estimate id.');
        if (!status || !STATUS.includes(status)) throw new AppError(400, 'Invalid Estimate Status Request', 'Invalid estimate status value.');

        const updated = await estimateRepo.updateStatus(id, status);

        if (!updated)
            throw new AppError(400, 'Invalid Estimate Status Request', 'Failed to update the estimate status. The estimate may not exist or an unexpected error occurred.');

        return ApiResponse(res, 200, { id }, 'Estimate deleted successfully.');
    } catch (error) {
        return next(error);
    }
}

export async function deleteEstimate(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const id = Number(req.params.id);
        if (!id) throw new AppError(400, 'Invalid Delete Estimate Request', 'Invalid estimate id.');

        const deleted = await estimateRepo.deleteEstimate(id);

        if (!deleted) throw new AppError(400, 'Invalid Estimate Delete Request', 'Failed to delete the estimate. The estimate may not exist or an unexpected error occurred.');

        return ApiResponse(res, 200, { id }, 'Estimate deleted successfully.');
    } catch (error) {
        return next(error);
    }
}
