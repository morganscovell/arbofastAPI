import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../helper/api-response';
import { AppError } from '../error/app-error';
import * as workItemRepo from '../repositories/work-items';
import { WorkItemDto } from '../validators';

export async function uploadImages(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files?.length) throw new AppError(400, 'Work Item Image Missing', 'Please provide work item images');

        const images = files.map((file) => ({
            url: file.filename,
            originalname: file.originalname
        }));

        const uploadedImages = await workItemRepo.saveImage(images);

        return ApiResponse(res, 201, uploadedImages, 'Images uploaded successfully');
    } catch (error) {
        return next(error);
    }
}

export async function createWokItem(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const body: WorkItemDto = req.body;

        if (!body.images.length) throw new AppError(400, 'Invalid Create Work Item Request', 'Work item images must be provided');

        const workItem = await workItemRepo.createWorkItem(body);

        return ApiResponse(res, 201, workItem, 'Work item saved successfully');
    } catch (error) {
        return next(error);
    }
}

export const updateWorkItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.body.id);
        if (!id) throw new AppError(400, 'Invalid Update Work item Request', 'Invalid work item id');

        const body: WorkItemDto = req.body;

        if (!body.images.length) throw new AppError(400, 'Invalid Create Work Item Request', 'Work item images must be provided');

        const workItem = await workItemRepo.updateWorkItem(body);

        return ApiResponse(res, 200, workItem, 'Work item updated successfully');
    } catch (error) {
        next(error);
    }
};

export const getWorkItemById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        if (!id) throw new AppError(400, 'Invalid Work item Get Request', 'Invalid work item id');

        const workItem = await workItemRepo.getWorkItemById(id);

        if (!workItem) throw new AppError(400, 'Invalid Get Work Item Request', 'Work item not found');

        return ApiResponse(res, 200, workItem, 'Work item data');
    } catch (error) {
        next(error);
    }
};

export async function deleteWorkItem(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const id = Number(req.params.id);
        if (!id || isNaN(id)) throw new AppError(400, 'Invalid DELETE Work Items Request', 'Please provide valid job id');

        const deleted = await workItemRepo.deleteWorkItem(id);

        if (!deleted) throw new AppError(400, 'Invalid Work Item Delete Request', 'Failed to delete the work item. The work item may not exist or an unexpected error occurred.');

        return ApiResponse(res, 200, { id }, 'Work item deleted successfully');
    } catch (error) {
        return next(error);
    }
}
