import { ShiftService } from './shift.service.js';
export declare class ShiftController {
    private readonly shiftService;
    constructor(shiftService: ShiftService);
    create(createShiftDto: any): null;
    findAll(): never[];
    findOne(id: string): null;
    update(id: string, updateShiftDto: any): null;
    remove(id: string): null;
    assignStaff(id: string, staffId: number): null;
    removeStaff(assignmentId: string): null;
}
