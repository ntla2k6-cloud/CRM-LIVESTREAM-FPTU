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
let StaffService = class StaffService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(createStaffDto) {
        return this.prisma.staff.create({ data: createStaffDto });
    }
    findAll() {
        return this.prisma.staff.findMany();
    }
    findOne(id) {
        return this.prisma.staff.findUnique({ where: { id } });
    }
    update(id, updateStaffDto) {
        return this.prisma.staff.update({
            where: { id },
            data: updateStaffDto,
        });
    }
    remove(id) {
        return this.prisma.staff.delete({ where: { id } });
    }
};
StaffService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], StaffService);
export { StaffService };
//# sourceMappingURL=staff.service.js.map