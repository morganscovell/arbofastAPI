interface IAddress {
    id?: number | undefined;
    address: string;
    isDefault: boolean | 0 | 1;
    type: string;
    userId: number;
}

interface IUser {
    id?: number;
    username: string;
    email: string;
    password: string | null;
    phone: string | null;
    photo: string | null;
    active: boolean;
    role: 'USER' | 'ADMIN';
    createdAt: Date;
    updatedAt: Date;
}

interface IChangePassword {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
