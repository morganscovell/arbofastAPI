type AmountPreference = 'FULL' | 'HALF' | 'ANY';
type MulchRequestStatus = 'PENDING' | 'DECLINED' | 'APPROVED';

interface IMulchRequest {
    id?: number | undefined;
    amountPreference: AmountPreference;
    username: string;
    phone: string;
    address: string;
    longitude: number | null;
    latitude: number | null;
    photoUrl: string | null;
    instruction: string | null;
    status: MulchRequestStatus;
    scheduledData: string | null;
    scheduledTime: string | null;
    userId: number;
}
