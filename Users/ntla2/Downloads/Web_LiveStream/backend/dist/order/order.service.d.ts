import { PrismaService } from '../prisma/prisma.service.js';
export declare class OrderService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<{
        id: string;
        status: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        recipientName: string;
        address: string;
        shippingProvider: string | null;
        trackingCode: string | null;
        trackingLink: string | null;
        giftName: string | null;
        winnerId: string | null;
    }>;
    findAll(): Promise<{
        id: string;
        date: string;
        recipient: string;
        phone: string;
        address: string;
        gift: string;
        status: string;
        shippingProvider: string | null;
        trackingCode: string | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        status: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        recipientName: string;
        address: string;
        shippingProvider: string | null;
        trackingCode: string | null;
        trackingLink: string | null;
        giftName: string | null;
        winnerId: string | null;
    } | null>;
    findByTracking(trackingCode: string): Promise<{
        id: string;
        status: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        recipientName: string;
        address: string;
        shippingProvider: string | null;
        trackingCode: string | null;
        trackingLink: string | null;
        giftName: string | null;
        winnerId: string | null;
    } | null>;
    update(id: string, data: any): Promise<{
        id: string;
        status: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        recipientName: string;
        address: string;
        shippingProvider: string | null;
        trackingCode: string | null;
        trackingLink: string | null;
        giftName: string | null;
        winnerId: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        status: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        recipientName: string;
        address: string;
        shippingProvider: string | null;
        trackingCode: string | null;
        trackingLink: string | null;
        giftName: string | null;
        winnerId: string | null;
    }>;
}
