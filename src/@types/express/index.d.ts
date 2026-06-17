declare namespace Express {
    export interface Request {
        user?: IAuthenticatedUser;
        originalRequestBody: any;
    }
}
