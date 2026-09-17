import { StaffService } from './staff.service.js';
export declare class StaffController {
    private readonly staffService;
    constructor(staffService: StaffService);
    create(createStaffDto: any): import(".prisma/client").Prisma.Prisma__StaffClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
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
    }[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__StaffClient<{
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
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, updateStaffDto: any): import(".prisma/client").Prisma.Prisma__StaffClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__StaffClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
