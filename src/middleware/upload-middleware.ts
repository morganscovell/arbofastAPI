import * as path from 'path';
import * as crypto from 'crypto';
import multer from 'multer';
import { Request } from 'express';

function diskStorage(destination: string): multer.StorageEngine {
    return multer.diskStorage({
        destination: function (req: Request, file: Express.Multer.File, cb: (_error: Error | null, _destination: string) => void) {
            cb(null, destination);
        },
        filename: function (req: Request, file: Express.Multer.File, cb: (_error: Error | null, _filename: string) => void) {
            const ext: string = path.extname(file.originalname).toLowerCase();
            const uniqueName: string = crypto.randomUUID() + ext;
            cb(null, uniqueName);
        }
    });
}

export const upload = multer({ storage: diskStorage(process.cwd() + '/public') });
