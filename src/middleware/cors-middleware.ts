import cors from 'cors';

let CORS_ALLOWED_ORIGIN: string | string[] = process.env.CORS_ALLOWED_ORIGIN as string;

if (!CORS_ALLOWED_ORIGIN) throw new Error('CORS option is not defined');

if (CORS_ALLOWED_ORIGIN != '*' && !CORS_ALLOWED_ORIGIN.includes(',')) CORS_ALLOWED_ORIGIN = (CORS_ALLOWED_ORIGIN as string).trim();
if (CORS_ALLOWED_ORIGIN.includes(','))
    CORS_ALLOWED_ORIGIN = (CORS_ALLOWED_ORIGIN as string)
        .split(',')
        .map((origin: string) => origin.trim())
        .filter(Boolean);

type StaticOrigin = boolean | string | RegExp | Array<boolean | string | RegExp>;

export default function corsMiddleware() {
    if (CORS_ALLOWED_ORIGIN == '*') {
        return cors();
    } else if (Array.isArray(CORS_ALLOWED_ORIGIN)) {
        return cors({
            origin: function (requestOrigin: string | undefined, callback: (_err: Error | null, _origin?: StaticOrigin) => void) {
                if (!requestOrigin) return callback(null, true);
                if (CORS_ALLOWED_ORIGIN.indexOf(requestOrigin as string) !== -1) callback(null, true);
                else callback(new Error('Not allowed by CORS'));
            }
        });
    } else {
        return cors({ origin: CORS_ALLOWED_ORIGIN });
    }
}
