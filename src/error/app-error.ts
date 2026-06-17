export class AppError extends Error {
    statusCode: number;
    extraKeys: Record<string, any> | undefined;
    error: Record<string, any> | undefined;

    constructor(statusCode: number, name: string, message: string, error?: any /* extraKeys = undefined */) {
        super(message);
        if (name) this.name = name;
        this.message = message;
        this.statusCode = statusCode;
        if (error) this.error = error;
        // if (extraKeys) this.extraKeys = extraKeys;
    }
}
