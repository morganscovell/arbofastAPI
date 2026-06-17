import { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import getPoolConnection from '../connection';
import { AppError } from '../error/app-error';

const pool: Pool = getPoolConnection();

/* TODO: before assign work item to estimate check it already assigned to estimate or not.
because if same work item is assign to 2 estimate then if one estimate delete then while fetching second estimate it will break query */

type CreateEstimate = IEstimate & { workItems: number[] };

export async function saveEstimate(data: CreateEstimate): Promise<number> {
    const connection: PoolConnection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Validate work items exist
        const placeholders = data.workItems.map(() => '?').join(',');

        const [existingWorkItems] = await connection.query<RowDataPacket[]>(`SELECT id FROM work_items WHERE id IN (${placeholders})`, data.workItems);

        const existingIds = new Set(existingWorkItems.map((item) => item.id));

        const invalidWorkItemIds = data.workItems.filter((id) => !existingIds.has(id));

        if (invalidWorkItemIds.length) throw new AppError(400, 'Invalid Work Item ID in Estimate', `Invalid work item ids: ${invalidWorkItemIds.join(', ')}.`);

        // 2. Insert estimate
        const [estimateResult] = await connection.execute<ResultSetHeader>(
            `INSERT INTO estimates (username, email, phone, address, latitude, longitude, status, noteOrInstruction,
                userId, equipmentOrCrewOptions, hazards) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.username,
                data.email,
                data.phone,
                data.address,
                data.latitude,
                data.longitude,
                data.status ?? 'PENDING',
                data.noteOrInstruction,
                data.userId,
                data.equipmentOrCrewOptions ? JSON.stringify(data.equipmentOrCrewOptions) : null,
                data.hazards ? JSON.stringify(data.hazards) : null
            ]
        );

        const estimateId = estimateResult.insertId;

        // 3. Insert estimate work items
        const values = data.workItems.map((id) => [estimateId, id]);
        await connection.query('INSERT INTO estimate_work_items (estimateId, workItemId ) VALUES ?', [values]);

        await connection.commit();

        return estimateId;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

type UpdateEstimate = IEstimate & { workItems: number[] };

export async function updateEstimate(data: UpdateEstimate): Promise<number> {
    if (!data.id) throw new AppError(400, 'Invalid Update Estimate Transaction', 'Invalid estimate id.');

    const connection: PoolConnection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Check estimate exists
        const [estimateRows] = await connection.execute<RowDataPacket[]>('SELECT id FROM estimates WHERE id = ?;', [data.id]);

        if (!estimateRows.length) throw new AppError(404, 'Invalid Update Estimate Transaction', `Estimate does not exist.`);

        // 2. Validate work items exist
        const placeholders = data.workItems.map((id) => id).join(',');

        const [existingWorkItems] = await connection.query<RowDataPacket[]>(`SELECT id FROM work_items WHERE id IN (${placeholders});`);

        const existingIds = new Set(existingWorkItems.map((item) => item.id));

        const invalidIds = data.workItems.filter((id) => !existingIds.has(id));

        if (invalidIds.length) throw new AppError(400, 'Invalid Update Estimate Transaction', `Invalid work item ids: ${invalidIds.join(', ')}.`);

        // 3. Get current work items
        const [currentRows] = await connection.execute<RowDataPacket[]>('SELECT workItemId FROM estimate_work_items WHERE estimateId = ?;', [data.id]);

        const currentIds: number[] = currentRows.map((row) => row.workItemId);

        const currentSet: Set<number> = new Set(currentIds);
        const incomingSet: Set<number> = new Set(data.workItems);

        // 4. Find items to add
        const itemsToInsert: number[] = data.workItems.filter((id) => !currentSet.has(id));

        // 5. Find items to remove
        const itemsToDelete: number[] = currentIds.filter((id) => !incomingSet.has(id));

        // 6. Update estimate
        await connection.execute(
            `UPDATE estimates SET username = ?, email = ?, phone = ?, address = ?, latitude = ?, longitude = ?,
            status = ?, noteOrInstruction = ?, userId = ?, equipmentOrCrewOptions = ?, hazards = ? WHERE id = ?;`,
            [
                data.username,
                data.email,
                data.phone,
                data.address,
                data.latitude,
                data.longitude,
                data.status ?? 'PENDING',
                data.noteOrInstruction,
                data.userId,
                data.equipmentOrCrewOptions ? JSON.stringify(data.equipmentOrCrewOptions) : null,
                data.hazards ? JSON.stringify(data.hazards) : null,
                data.id
            ]
        );

        // 7. Delete removed work items
        if (itemsToDelete.length) {
            const deletePlaceholders = itemsToDelete.map((id) => id).join(',');
            await connection.query(`DELETE FROM estimate_work_items WHERE estimateId = ${data.id} AND workItemId IN (${deletePlaceholders});`);
        }

        // 8. Insert new work items
        if (itemsToInsert.length) {
            const values = itemsToInsert.map((id) => [data.id, id]);
            await connection.query(`INSERT INTO estimate_work_items (estimateId, workItemId) VALUES ?;`, [values]);
        }

        await connection.commit();

        return data.id;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

interface EstimateWithItems extends IEstimate {
    workItems: (IWorkItem & { images: IWorkItemImage[] })[];
}

interface AllEstimateParams {
    page: number;
    limit: number;
    userId?: number;
    userEmail?: string;
}

export async function getAllEstimates(params: AllEstimateParams): Promise<{ data: EstimateWithItems[]; total: number }> {
    const offset = (params.page - 1) * params.limit;

    const [countRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM estimates;');

    const total = Number(countRows[0]?.total) || 0;

    if (total == 0) return { data: [], total: 0 };

    let whereClause = '';

    if (params.userId && params.userEmail) {
        whereClause = `WHERE userId = ${params.userId} OR email = "${params.userEmail}"`;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
        `
            SELECT
                e.id AS estimateId, e.username, e.email, e.phone, e.address, e.latitude, e.longitude,
                e.status, e.noteOrInstruction, e.userId, e.equipmentOrCrewOptions, e.hazards,

                wi.id AS workItemId, wi.treeSpecie, wi.quantity, wi.scopes, wi.raiseCanopyFeet, wi.crownReductionPercentage,
                wi.customServiceNote, wi.desiredTimeFrame, wi.noCleanUp, wi.woodHandling, wi.woodLengthToBeCut,
                wi.debrisHandling, wi.accessOption, wi.accessOptionNote, wi.laborCost, wi.estimatedHours, wi.note,

                img.id AS imageId, img.url, img.type, img.config

            FROM (
                SELECT *
                FROM estimates
                ${whereClause}
                ORDER BY id DESC
                LIMIT ${params.limit} OFFSET ${offset}
            ) e

            LEFT JOIN estimate_work_items ewi
                ON ewi.estimateId = e.id

            LEFT JOIN work_items wi
                ON wi.id = ewi.workItemId

            LEFT JOIN work_item_images img
                ON img.workItemId = wi.id;`
    );

    const estimateMap = new Map<number, EstimateWithItems>();

    const workItemMap = new Map<string, any>();

    for (const row of rows) {
        // Create estimate
        if (!estimateMap.has(row.estimateId)) {
            estimateMap.set(row.estimateId, {
                id: row.estimateId,
                username: row.username,
                email: row.email,
                phone: row.phone,
                address: row.address,
                latitude: row.latitude,
                longitude: row.longitude,
                status: row.status,
                noteOrInstruction: row.noteOrInstruction,
                userId: row.userId,
                equipmentOrCrewOptions: row.equipmentOrCrewOptions,
                hazards: row.hazards,
                // equipmentOrCrewOptions: row.equipmentOrCrewOptions ? JSON.parse(row.equipmentOrCrewOptions) : [],
                // hazards: row.hazards ? JSON.parse(row.hazards) : [],
                workItems: []
            });
        }

        const estimate = estimateMap.get(row.estimateId)!;

        // No work item
        if (!row.workItemId) continue;

        const workItemKey = `${row.estimateId}-${row.workItemId}`;

        let workItem = workItemMap.get(workItemKey);

        // Create work item
        if (!workItem) {
            workItem = {
                id: row.workItemId,
                treeSpecie: row.treeSpecie,
                quantity: row.quantity,
                scopes: row.scopes,
                raiseCanopyFeet: row.raiseCanopyFeet,
                crownReductionPercentage: row.crownReductionPercentage,
                customServiceNote: row.customServiceNote,
                desiredTimeFrame: row.desiredTimeFrame,
                noCleanUp: !!row.noCleanUp,
                woodHandling: row.woodHandling,
                woodLengthToBeCut: row.woodLengthToBeCut,
                debrisHandling: row.debrisHandling,
                accessOption: row.accessOption,
                accessOptionNote: row.accessOptionNote,
                laborCost: row.laborCost,
                estimatedHours: row.estimatedHours,
                note: row.note,
                images: [],
                _imageIds: new Set<number>()
            };

            estimate.workItems.push(workItem);

            workItemMap.set(workItemKey, workItem);
        }

        // Add image only once
        if (row.imageId && !workItem._imageIds.has(row.imageId)) {
            workItem._imageIds.add(row.imageId);

            workItem.images.push({
                id: row.imageId,
                url: row.url,
                type: row.type,
                config: row.config,
                workItemId: row.workItemId
            });
        }
    }

    // cleanup internal set
    for (const estimate of estimateMap.values()) {
        for (const item of estimate.workItems) {
            delete (item as any)._imageIds;
        }
    }

    return { data: Array.from(estimateMap.values()), total };
}

export async function getEstimateById(id: number): Promise<EstimateWithItems | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            e.id AS estimateId, e.username, e.email, e.phone, e.address, e.latitude, e.longitude,
            e.status, e.noteOrInstruction, e.userId, e.equipmentOrCrewOptions, e.hazards,

            wi.id AS workItemId, wi.treeSpecie, wi.quantity, wi.scopes, wi.raiseCanopyFeet, wi.crownReductionPercentage,
            wi.customServiceNote, wi.desiredTimeFrame, wi.noCleanUp, wi.woodHandling, wi.woodLengthToBeCut,
            wi.debrisHandling, wi.accessOption, wi.accessOptionNote, wi.laborCost, wi.estimatedHours, wi.note,

            img.id AS imageId, img.url, img.type, img.config

        FROM estimates e

        LEFT JOIN estimate_work_items ewi
            ON ewi.estimateId = e.id

        LEFT JOIN work_items wi
            ON wi.id = ewi.workItemId

        LEFT JOIN work_item_images img
            ON img.workItemId = wi.id

        WHERE e.id = ?;`,
        [id]
    );

    const firstRow = rows[0];
    if (!firstRow) return undefined;

    const estimate: EstimateWithItems = {
        id: firstRow.estimateId,
        username: firstRow.username,
        email: firstRow.email,
        phone: firstRow.phone,
        address: firstRow.address,
        latitude: firstRow.latitude,
        longitude: firstRow.longitude,
        status: firstRow.status,
        noteOrInstruction: firstRow.noteOrInstruction,
        userId: firstRow.userId,
        equipmentOrCrewOptions: firstRow.equipmentOrCrewOptions,
        hazards: firstRow.hazards,
        workItems: []
    };

    const workItemMap = new Map<number, any>();

    for (const row of rows) {
        if (!row.workItemId) continue;

        let workItem = workItemMap.get(row.workItemId);

        if (!workItem) {
            workItem = {
                id: row.workItemId,
                treeSpecie: row.treeSpecie,
                quantity: row.quantity,
                scopes: row.scopes,
                raiseCanopyFeet: row.raiseCanopyFeet,
                crownReductionPercentage: row.crownReductionPercentage,
                customServiceNote: row.customServiceNote,
                desiredTimeFrame: row.desiredTimeFrame,
                noCleanUp: !!row.noCleanUp,
                woodHandling: row.woodHandling,
                woodLengthToBeCut: row.woodLengthToBeCut,
                debrisHandling: row.debrisHandling,
                accessOption: row.accessOption,
                accessOptionNote: row.accessOptionNote,
                laborCost: row.laborCost,
                estimatedHours: row.estimatedHours,
                note: row.note,
                images: [],
                _imageIds: new Set<number>()
            };

            estimate.workItems.push(workItem);
            workItemMap.set(row.workItemId, workItem);
        }

        if (row.imageId && !workItem._imageIds.has(row.imageId)) {
            workItem._imageIds.add(row.imageId);

            workItem.images.push({
                id: row.imageId,
                url: row.url,
                type: row.type,
                config: row.config,
                workItemId: row.workItemId
            });
        }
    }

    // Remove internal helper property
    for (const workItem of estimate.workItems) {
        delete (workItem as any)._imageIds;
    }

    return estimate;
}

export async function updateStatus(id: number, status: EstimateStatus): Promise<boolean> {
    const query = 'UPDATE estimates SET status = ? WHERE id = ?;';
    const [result] = await pool.execute<ResultSetHeader>(query, [status, id]);
    return result.affectedRows > 0;
}

export async function deleteEstimate(id: number): Promise<boolean> {
    const query = 'DELETE FROM estimates WHERE id = ?;';
    const [result] = await pool.execute<ResultSetHeader>(query, [id]);
    return result.affectedRows > 0;
}
