import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

type Item = {
    scopes: WorkItemScope[];
    quantity: number;
    laborCost: number | null;
};

export interface InvoiceData {
    username: string;
    address: string;
    workItems: Item[];
    total: number;
}

export function generateItemsHtml(workItems: Item[]) {
    return workItems
        .map((item) => {
            const price = Number(item.laborCost || 0);
            const quantity = Number(item.quantity || 0);

            return `
                <tr>
                    <td>
                        ${item.scopes
                            .join(', ')
                            .replace(/_/g, ' ')
                            .toLowerCase()
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </td>
                    <td class="right">${item.quantity || 0}</td>
                    <td class="right">$${price.toFixed(2)}</td>
                    <td class="right">$${(price * quantity).toFixed(2)}</td>
                </tr>
            `;
        })
        .join('');
}

export async function generateInvoicePdf(invoiceData: InvoiceData): Promise<any> {
    let html = fs.readFileSync(path.join(process.cwd(), '/src/mail/invoice-pdf-template.html'), 'utf8');

    html = html
        .replace(/{{fullname}}/g, invoiceData.username)
        .replace(/{{address}}/g, invoiceData.address)
        .replace(/{{date}}/g, new Date().toLocaleDateString())
        .replace('{{invoiceNumber}}', Math.floor(Math.random() * 100000).toString())
        .replace('{{logoUrl}}', process.env.SERVER_DOMAIN + '/4gt.png')
        .replace('{{itemsHtml}}', generateItemsHtml(invoiceData.workItems))
        .replace('{{total}}', `${invoiceData.total.toFixed(2)}`);

    // const browser = await puppeteer.launch();
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'load' });
    await page.emulateMediaType('screen');

    const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
    });

    await browser.close();

    return pdf;
}
