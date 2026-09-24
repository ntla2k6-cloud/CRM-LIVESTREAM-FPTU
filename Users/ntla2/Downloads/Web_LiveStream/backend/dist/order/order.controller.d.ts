import { OrderService } from './order.service.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
export declare class OrderController {
    private readonly orderService;
    constructor(orderService: OrderService);
    create(createOrderDto: any): Promise<{
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
    update(id: string, updateOrderDto: UpdateOrderDto): Promise<{
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
