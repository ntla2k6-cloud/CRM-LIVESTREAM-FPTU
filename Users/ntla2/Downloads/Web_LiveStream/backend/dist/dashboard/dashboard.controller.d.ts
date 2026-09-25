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
            customer: {
                fullName: string | null;
            };
            id: string;
            status: string;
            createdAt: Date;
        }[];
    }>;
}
