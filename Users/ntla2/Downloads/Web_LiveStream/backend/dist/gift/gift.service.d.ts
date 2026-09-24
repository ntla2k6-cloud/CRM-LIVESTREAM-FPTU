import { PrismaService } from '../prisma/prisma.service.js';
export declare class GiftService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: any): import(".prisma/client").Prisma.Prisma__GiftClient<{
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
    findOne(id: number): Promise<{
        id: number;
        name: string;
        status: string;
        sku: string;
        stock: number;
        price: string;
    }>;
    update(id: number, data: any): import(".prisma/client").Prisma.Prisma__GiftClient<{
        id: number;
        name: string;
        status: string;
        sku: string;
        stock: number;
        price: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: number): import(".prisma/client").Prisma.Prisma__GiftClient<{
        id: number;
        name: string;
        status: string;
        sku: string;
        stock: number;
        price: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
