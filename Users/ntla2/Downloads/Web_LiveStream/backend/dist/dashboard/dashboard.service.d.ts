import { PrismaService } from '../prisma/prisma.service.js';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        metrics: {
            sessions: number;
            leads: number;
            orders: number;
            conversionRate: number;
        };
        chartData: {
            date: string;
            total: number;
            hot: number;
        }[];
    }>;
}
