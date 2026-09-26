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
            id: string;
            status: string;
            createdAt: Date;
            customer: {
                fullName: string | null;
            };
        }[];
    }>;
    getAnalytics(sessionId: string): Promise<{
        id: string;
        name: string;
        date: string;
        comments: number;
        rawData: {
            comments: {
                user: string;
                content: string;
                intent: string;
                time: string;
            }[];
        };
    } | null>;
}
