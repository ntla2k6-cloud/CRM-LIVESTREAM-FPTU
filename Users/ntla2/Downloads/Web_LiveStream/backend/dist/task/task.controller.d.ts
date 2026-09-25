import { TaskService } from './task.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
export declare class TaskController {
    private readonly taskService;
    constructor(taskService: TaskService);
    create(createTaskDto: CreateTaskDto): import(".prisma/client").Prisma.Prisma__TaskClient<{
        description: string | null;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        assignedTo: string | null;
        priority: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
        description: string | null;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        assignedTo: string | null;
        priority: string | null;
    }[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__TaskClient<{
        description: string | null;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        assignedTo: string | null;
        priority: string | null;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, updateTaskDto: UpdateTaskDto): import(".prisma/client").Prisma.Prisma__TaskClient<{
        description: string | null;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        assignedTo: string | null;
        priority: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__TaskClient<{
        description: string | null;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        assignedTo: string | null;
        priority: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
