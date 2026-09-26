export declare const STATUS_LABELS: Record<string, {
    label: string;
    location: string;
    emoji: string;
}>;
export declare class EmailService {
    private readonly logger;
    private transporter;
    constructor();
    sendStatusUpdate(shipment: any, newStatus: string): Promise<void>;
}
