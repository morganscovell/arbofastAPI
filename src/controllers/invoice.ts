import fs from 'fs';
import path from 'path';
import sgMail from '@sendgrid/mail';
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../helper/api-response';
import { AppError } from '../error/app-error';
import * as estimateRepo from '../repositories/estimates';
import { InvoiceData, generateInvoicePdf } from '../mail/generate-invoice-pdf';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendInvoice(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const estimateId = Number(req.params.estimateId);
        if (!estimateId || Number.isNaN(estimateId)) throw new AppError(400, 'Invalid Get Estimate Request', 'Invalid estimate id.');

        const estimate = await estimateRepo.getEstimateById(estimateId);
        if (!estimate) throw new AppError(404, 'Invalid Get Estimate Request', 'Estimate not found.');

        const invoiceData: InvoiceData = {
            username: estimate.username,
            address: estimate.address,
            workItems: estimate.workItems.map((item) => ({ scopes: item.scopes, quantity: item.quantity, laborCost: item.laborCost })),
            total: estimate.workItems.reduce((acc: number, item) => {
                acc = acc + (item.laborCost ? Number(item.laborCost) : 0);
                return acc;
            }, 0)
        };

        /* GENERATE PDF FOR INVOICE */
        const pdfBuffer = await generateInvoicePdf(invoiceData);

        /* EMAIL TEMPLATE FOR INVOICE, WITH ATTACHED INVOICE PDF */
        let html = fs.readFileSync(path.join(process.cwd(), '/src/mail/invoice-mail-template.html'), 'utf8');

        html = html.replace(/{{jobId}}/g, estimate.id! + '').replace(/{{name}}/g, estimate.username);

        await sgMail.send({
            from: process.env.SENDGRID_FROM_EMAIL!,
            to: estimate.email,
            subject: 'JOB ESTIMATE',
            html,
            attachments: [
                {
                    filename: 'invoice.pdf',
                    content: Buffer.from(pdfBuffer).toString('base64'),
                    type: 'application/pdf',
                    disposition: 'attachment'
                }
            ]
        });

        return ApiResponse(res, 200, null, 'Invoice sent successfully.');
    } catch (error) {
        return next(error);
    }
}
