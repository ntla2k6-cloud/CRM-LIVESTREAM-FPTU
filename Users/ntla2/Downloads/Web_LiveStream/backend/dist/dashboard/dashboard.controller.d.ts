import { DashboardService } from './dashboard.service.js';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
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
