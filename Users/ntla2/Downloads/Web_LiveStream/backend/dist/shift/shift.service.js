var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
let ShiftService = class ShiftService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(createShiftDto) {
        return this.prisma.shift.create({ data: createShiftDto });
    }
    findAll() {
        return this.prisma.shift.findMany({
            include: {
                assignments: {
                    include: { staff: true }
                }
            }
        });
    }
    findOne(id) {
        return this.prisma.shift.findUnique({
            where: { id },
            include: { assignments: { include: { staff: true } } }
        });
    }
    update(id, updateShiftDto) {
        return this.prisma.shift.update({
            where: { id },
            data: updateShiftDto,
        });
    }
    remove(id) {
        return this.prisma.shift.delete({ where: { id } });
    }
    async assignStaff(shiftId, staffId) {
        return this.prisma.shiftAssignment.create({
            data: { shiftId, staffId }
        });
    }
    async removeStaff(assignmentId) {
        return this.prisma.shiftAssignment.delete({
            where: { id: assignmentId }
        });
    }
};
ShiftService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], ShiftService);
export { ShiftService };
//# sourceMappingURL=shift.service.js.map