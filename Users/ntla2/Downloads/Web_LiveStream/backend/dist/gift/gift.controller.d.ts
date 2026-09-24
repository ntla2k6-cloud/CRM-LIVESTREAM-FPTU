import { GiftService } from './gift.service.js';
export declare class GiftController {
    private readonly giftService;
    constructor(giftService: GiftService);
    create(createGiftDto: any): import(".prisma/client").Prisma.Prisma__GiftClient<{
        id: number;
        name: string;
        status: string;
        sku: string;
        stock: number;
        price: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
        id: number;
        name: string;
        status: string;
        sku: string;
        stock: number;
        price: string;
    }[]>;
    findOne(id: string): Promise<{
        id: number;
        name: string;
        status: string;
        sku: string;
        stock: number;
        price: string;
    }>;
    update(id: string, updateGiftDto: any): import(".prisma/client").Prisma.Prisma__GiftClient<{
        id: number;
        name: string;
        status: string;
        sku: string;
        stock: number;
        price: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__GiftClient<{
        id: number;
        name: string;
        status: string;
        sku: string;
        stock: number;
        price: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
