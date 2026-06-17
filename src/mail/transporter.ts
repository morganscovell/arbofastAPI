import nodemailer from 'nodemailer';

const MAILER_MAIL_ADDRESS: string = process.env.MAILER_MAIL_ADDRESS as string;
const GOOGLE_MAILER_CLIENT_ID: string = process.env.GOOGLE_MAILER_CLIENT_ID as string;
const GOOGLE_MAILER_CLIENT_SECRET: string = process.env.GOOGLE_MAILER_CLIENT_SECRET as string;
const GOOGLE_MAILER_REFRESH_TOKEN: string = process.env.GOOGLE_MAILER_REFRESH_TOKEN as string;

if (!MAILER_MAIL_ADDRESS) throw new Error('email address not provided for mail service.');
if (!GOOGLE_MAILER_CLIENT_ID) throw new Error('google client id not provided for mail service.');
if (!GOOGLE_MAILER_CLIENT_SECRET) throw new Error('google client secret not provided for mail service.');
if (!GOOGLE_MAILER_REFRESH_TOKEN) throw new Error('google refresh token not provided for mail service.');

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: MAILER_MAIL_ADDRESS,
        clientId: GOOGLE_MAILER_CLIENT_ID,
        clientSecret: GOOGLE_MAILER_CLIENT_SECRET,
        refreshToken: GOOGLE_MAILER_REFRESH_TOKEN
    }
});

transporter.verify((error: Error | null, success: true) => {
    if (success) return console.log('mail server is running...');
    console.log('mail server error: ' + error);
});

/* 
    STEPS TO SETUP MAIL USING GOOGLE OAUTH2

    1. create new project
    2. enable google api
    3. create a new credentials (OAuth client ID)
        3.1. select web application
        3.2. add Authorized redirect URIs (https://developers.google.com/oauthplayground)
        3.3. save
    4. add test user with the same email you want to send emails with
    5. goto data access and search for Gmail API and then select ".../auth/gmail.send" and update
    6. now goto google oauth playground and find Gmail API in the left API panel
        6.1. select https://mail.google.com and https://www.googleapis.com/auth/gmail.send
        6.2. after selection click on the settings button (with gear icon) on the top right of the page and click
        6.3. enter OAuth Client ID and OAuth Client secret which you downloaded while creating credential
        6.4. click on Authorize APIs button on the left panel
    7. after authorizing goto Exchange authorization code for tokens tab on the left panel
    and click "Exchange authorized code for token button" after clicking you get access and refresh tokens
*/
