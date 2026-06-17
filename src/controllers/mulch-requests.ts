import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../helper/api-response';
import { AppError } from '../error/app-error';
import * as mulchRequestRepo from '../repositories/mulch-requests';
import { CreateMulchRequestDto } from '../validators/mulch-request';

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

        const { data, total } = await mulchRequestRepo.getAll(page, limit);

        const payload = {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };

        return ApiResponse(res, 200, payload, 'All mulch requests.');
    } catch (error) {
        return next(error);
    }
}

export async function getUserRequest(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

        const { data, total } = await mulchRequestRepo.getUserAllRequest(req.user!.id, page, limit);

        const payload = {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };

        return ApiResponse(res, 200, payload, 'All mulch requests.');
    } catch (error) {
        return next(error);
    }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const id = Number(req.params.id);
        if (!id) throw new AppError(400, 'Invalid Get Mulch Request', 'Invalid mulch request id.');

        const request: IMulchRequest | undefined = await mulchRequestRepo.getById(id);

        if (!request) throw new AppError(400, 'Invalid Get Mulch Request', 'No mulch request data found.');

        return ApiResponse(res, 200, request || null, 'Mulch requests data.');
    } catch (error) {
        return next(error);
    }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const userId = req.user!.id;
        const photoUrl = req.file ? req.file.filename : null;

        const body: CreateMulchRequestDto = req.body;
        const data: IMulchRequest = { ...body, photoUrl, userId };

        const id = await mulchRequestRepo.create(data);

        if (!id) throw new AppError(400, 'Failed to Save Mulch Request', 'Failed to save mulch request.');

        return ApiResponse(res, 201, { id, ...data }, 'Mulch request saved successfully.');
    } catch (error) {
        return next(error);
    }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const id = Number(req.body.id);
        if (!id) throw new AppError(400, 'Invalid Update Mulch Request', 'Invalid mulch request id.');

        const userId = req.user!.id;

        const body: CreateMulchRequestDto = req.body;

        const photoUrl = req.file ? req.file.filename : body?.photoUrl || null;

        const data: IMulchRequest = { ...body, photoUrl, userId };

        const updated = await mulchRequestRepo.update(data);

        if (!updated) throw new AppError(400, 'Invalid Update Mulch Request', 'Failed to update the mulch request. The request may not exist or an unexpected error occurred.');

        return ApiResponse(res, 200, { id, ...body, userId, photo: photoUrl }, 'Mulch request updated successfully.');
    } catch (error) {
        return next(error);
    }
}

export async function changeStatus(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const id = Number(req.body.id);
        const status: MulchRequestStatus = req.body.status;

        if (!id) throw new AppError(400, 'Invalid Update Mulch Request', 'Invalid mulch request id.');
        if (!['PENDING', 'DECLINED', 'APPROVED'].includes(status)) throw new AppError(400, 'Invalid Update Mulch Request', 'Invalid mulch request status.');

        const updated = await mulchRequestRepo.updateStatus(id, status);

        if (!updated) throw new AppError(400, 'Invalid Update Mulch Request', 'Failed to update the mulch request. The request may not exist or an unexpected error occurred.');

        return ApiResponse(res, 200, { id, status }, 'Mulch request status updated successfully.');
    } catch (error) {
        return next(error);
    }
}

export async function deleteMulchRequest(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const id = Number(req.params.id);
        if (!id) throw new AppError(400, 'Invalid Delete Mulch Request', 'Invalid mulch request id.');

        const deleted = await mulchRequestRepo.deleteRequest(id);

        if (!deleted) throw new AppError(400, 'Invalid Delete Mulch Request', 'Failed to delete the mulch request. The request may not exist or an unexpected error occurred.');

        return ApiResponse(res, 200, { id }, 'Mulch request deleted successfully.');
    } catch (error) {
        return next(error);
    }
}
