import { PrismaService } from '../prisma/prisma.service.js';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        metrics: {
            sessions: number;
            leads: number;
            customers: number;
            orders: number;
            conversionRate: number;
        };
        chartData: {
            date: string;
            total: number;
            hot: number;
        }[];
        recentActivities: {
            customer: {
                fullName: string | null;
            };
            id: string;
            status: string;
            createdAt: Date;
        }[];
    }>;
}
