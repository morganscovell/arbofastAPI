type TSignup = Pick<IUser, 'username' | 'email' | 'phone' | 'password'> & { address: string };

interface IAuthenticatedUser extends IUser {
    id: number;
    token: string;
    addresses: IAddress[];
}

type TTokenData = Pick<IUser, 'id'>;
