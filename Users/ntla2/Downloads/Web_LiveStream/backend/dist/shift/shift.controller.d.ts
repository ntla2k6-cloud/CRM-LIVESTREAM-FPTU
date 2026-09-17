import { ShiftService } from './shift.service.js';
export declare class ShiftController {
    private readonly shiftService;
    constructor(shiftService: ShiftService);
    create(createShiftDto: any): import(".prisma/client").Prisma.Prisma__ShiftClient<{
        id: number;
        color: string;
        title: string;
        day: number;
        time: string;
        type: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        assignments: ({
            staff: {
                id: number;
                name: string;
                status: string;
                phone: string | null;
                role: string;
                email: string | null;
                rate: number;
                avatar: string | null;
                color: string | null;
                joinDate: string | null;
            };
        } & {
            id: number;
            bonus: number;
            rateOverride: number | null;
            shiftId: number;
            staffId: number;
        })[];
    } & {
        id: number;
        color: string;
        title: string;
        day: number;
        time: string;
        type: string;
    })[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__ShiftClient<({
        assignments: ({
            staff: {
                id: number;
                name: string;
                status: string;
                phone: string | null;
                role: string;
                email: string | null;
                rate: number;
                avatar: string | null;
                color: string | null;
                joinDate: string | null;
            };
        } & {
            id: number;
            bonus: number;
            rateOverride: number | null;
            shiftId: number;
            staffId: number;
        })[];
    } & {
        id: number;
        color: string;
        title: string;
        day: number;
        time: string;
        type: string;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, updateShiftDto: any): import(".prisma/client").Prisma.Prisma__ShiftClient<{
        id: number;
        color: string;
        title: string;
        day: number;
        time: string;
        type: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__ShiftClient<{
        id: number;
        color: string;
        title: string;
        day: number;
        time: string;
        type: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    assignStaff(id: string, staffId: number): Promise<{
        id: number;
        bonus: number;
        rateOverride: number | null;
        shiftId: number;
        staffId: number;
    }>;
    removeStaff(assignmentId: string): Promise<{
        id: number;
        bonus: number;
        rateOverride: number | null;
        shiftId: number;
        staffId: number;
    }>;
}
