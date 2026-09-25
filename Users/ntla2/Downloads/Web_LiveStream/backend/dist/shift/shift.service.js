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
    async create(data) {
        const assignments = data.assignments?.create || [];
        const registeredIds = JSON.stringify(data.registered || []);
        return this.prisma.liveSession.create({
            data: {
                title: data.title,
                day: data.day,
                time: data.time,
                project: data.type || data.project,
                color: data.color,
                registered: registeredIds,
                assignments: {
                    create: assignments
                }
            }
        });
    }
    async findAll() {
        const sessions = await this.prisma.liveSession.findMany({
            include: {
                assignments: true
            }
        });
        return sessions.map(s => ({
            id: s.id,
            title: s.title,
            day: s.day,
            time: s.time,
            type: s.project,
            project: s.project,
            color: s.color,
            status: s.status,
            assignments: s.assignments,
            registered: s.registered ? JSON.parse(s.registered) : []
        }));
    }
    async findOne(id) {
        return this.prisma.liveSession.findUnique({ where: { id } });
    }
    async update(id, data) {
        if (data.registered) {
            data.registered = JSON.stringify(data.registered);
        }
        const { assignments, type, ...rest } = data;
        if (type)
            rest.project = type;
        if (assignments && assignments.create) {
            await this.prisma.liveSessionAssignment.deleteMany({ where: { liveSessionId: id } });
            rest.assignments = { create: assignments.create.map((a) => ({ staffId: Number(a.staffId) })) };
        }
        return this.prisma.liveSession.update({
            where: { id },
            data: rest
        });
    }
    async remove(id) {
        return this.prisma.liveSession.delete({ where: { id } });
    }
    async removeAssignment(assignmentId) {
        return this.prisma.liveSessionAssignment.delete({ where: { id: Number(assignmentId) } });
    }
    async assignStaff(shiftId, data) {
        return this.prisma.liveSessionAssignment.create({
            data: {
                liveSessionId: shiftId,
                staffId: Number(data.staffId)
            }
        });
    }
};
ShiftService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], ShiftService);
export { ShiftService };
//# sourceMappingURL=shift.service.js.map