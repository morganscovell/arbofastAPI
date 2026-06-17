import { Pool, PoolConnection, ResultSetHeader /* RowDataPacket */, RowDataPacket } from 'mysql2/promise';
import getPoolConnection from '../connection';
import { AppError } from '../error/app-error';

const pool: Pool = getPoolConnection();

export async function saveImage(data: { url: string; originalname: string }[]): Promise<
    {
        id: number;
        url: string;
        filename: string;
    }[]
> {
    const connection: PoolConnection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const values = data.map((item) => [item.url]);

        const [result] = await connection.query<ResultSetHeader>('INSERT INTO work_item_images (url) VALUES ?', [values]);

        await connection.commit();

        const firstInsertId = result.insertId;

        return data.map((item, index) => ({
            id: firstInsertId + index,
            url: item.url,
            filename: item.originalname
        }));
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

type CreateWorkItem = Omit<IWorkItem, 'id'> & { images: IWorkItemImage[] };

export async function createWorkItem(data: CreateWorkItem): Promise<CreateWorkItem & { id: number }> {
    const connection: PoolConnection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { images, scopes, ...workItemData } = data;

        const [result] = await connection.execute<ResultSetHeader>(
            `INSERT INTO work_items (treeSpecie, quantity, scopes, raiseCanopyFeet, crownReductionPercentage,
            customServiceNote, desiredTimeFrame, noCleanUp, woodHandling, woodLengthToBeCut, debrisHandling,
            accessOption, accessOptionNote, laborCost, estimatedHours, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
                workItemData.treeSpecie,
                workItemData.quantity,
                JSON.stringify(scopes),
                workItemData.raiseCanopyFeet,
                workItemData.crownReductionPercentage,
                workItemData.customServiceNote,
                workItemData.desiredTimeFrame,
                workItemData.noCleanUp,
                workItemData.woodHandling,
                workItemData.woodLengthToBeCut,
                workItemData.debrisHandling,
                workItemData.accessOption,
                workItemData.accessOptionNote,
                workItemData.laborCost,
                workItemData.estimatedHours,
                workItemData.note
            ]
        );

        const workItemId = result.insertId;

        if (images.length) {
            for await (const image of images) {
                await connection.execute('UPDATE work_item_images SET type = ?, config = ?, workItemId = ? WHERE id = ?;', [
                    image.type,
                    image.config ? JSON.stringify(image.config) : null,
                    workItemId,
                    image.id!
                ]);
            }
        }

        await connection.commit();

        return { id: workItemId, ...data };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

type UpdateWorkItem = IWorkItem & { images: IWorkItemImage[] };

export async function updateWorkItem(data: UpdateWorkItem): Promise<UpdateWorkItem> {
    if (!data.id) throw new AppError(400, 'Invalid Work Item Update Transaction', 'Work item id is not provided');

    const connection: PoolConnection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { images, scopes, ...workItemData } = data;

        // 1. Verify work item exists
        const [existingRows] = await connection.execute<RowDataPacket[]>('SELECT id FROM work_items WHERE id = ? LIMIT 1', [data.id!]);
        if (!existingRows.length) throw new AppError(400, 'Invalid Work Item Update Transaction', 'Work item not found');

        // 2. Update work item
        await connection.execute(
            `UPDATE work_items SET treeSpecie = ?, quantity = ?, scopes = ?, raiseCanopyFeet = ?,
            crownReductionPercentage = ?, customServiceNote = ?, desiredTimeFrame = ?, noCleanUp = ?, woodHandling = ?,
            woodLengthToBeCut = ?, debrisHandling = ?, accessOption = ?, accessOptionNote = ?, laborCost = ?,
            estimatedHours = ?, note = ? WHERE id = ?;`,
            [
                workItemData.treeSpecie,
                workItemData.quantity,
                JSON.stringify(scopes),
                workItemData.raiseCanopyFeet,
                workItemData.crownReductionPercentage,
                workItemData.customServiceNote,
                workItemData.desiredTimeFrame,
                workItemData.noCleanUp,
                workItemData.woodHandling,
                workItemData.woodLengthToBeCut,
                workItemData.debrisHandling,
                workItemData.accessOption,
                workItemData.accessOptionNote,
                workItemData.laborCost,
                workItemData.estimatedHours,
                workItemData.note,
                data.id!
            ]
        );

        // 3. Get incoming image IDs
        const imageIds = images.map((img) => img.id!);

        // 4. Delete removed images
        const placeholders = imageIds.map((id) => id).join(',');
        await connection.query<ResultSetHeader>(`DELETE FROM work_item_images WHERE workItemId = ${data.id} AND id NOT IN (${placeholders});`);

        // 5. update all images
        await Promise.all(
            images.map((image) =>
                connection.execute('UPDATE work_item_images SET type = ?, config = ?, workItemId = ? WHERE id = ?;', [
                    image.type,
                    image.config ? JSON.stringify(image.config) : null,
                    data.id!,
                    image.id!
                ])
            )
        );

        await connection.commit();

        return data;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

type WorkItemWithImages = IWorkItem & { images: IWorkItemImage[] };

export async function getWorkItemById(id: number): Promise<WorkItemWithImages | undefined> {
    const connection = await pool.getConnection();

    try {
        const [row] = await connection.execute<RowDataPacket[]>('SELECT * FROM work_items WHERE id = ? LIMIT 1;', [id]);
        if (!row.length) return undefined;

        const workItem: IWorkItem = row[0] as IWorkItem;
        // const scopes = JSON.parse((workItem.scopes as string) ?? '[]');

        const [images] = await connection.execute<RowDataPacket[]>('SELECT * FROM work_item_images WHERE workItemId = ? ORDER BY id ASC;', [id]);

        return {
            ...workItem,
            images: images.map((image) => ({
                id: Number(image.id),
                url: image.url,
                type: image.type,
                config: image.config ? JSON.parse(image.config) : null,
                workItemId: image.workItemId
            }))
        };
    } finally {
        connection.release();
    }
}

export async function deleteWorkItem(id: number): Promise<boolean> {
    const query = 'DELETE FROM work_items WHERE id = ?;';
    const [result] = await pool.execute<ResultSetHeader>(query, [id]);
    return result.affectedRows > 0;
}
