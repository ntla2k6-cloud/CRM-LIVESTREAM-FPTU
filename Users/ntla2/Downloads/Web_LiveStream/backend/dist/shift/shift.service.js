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
        let dayVal = null;
        if (data.day !== undefined && data.day !== null) {
            const parsed = parseInt(String(data.day));
            dayVal = isNaN(parsed) ? null : parsed;
        }
        return this.prisma.liveSession.create({
            data: {
                title: data.title || 'Ca trực mới',
                day: dayVal,
                time: data.time,
                project: data.type || data.project || 'Khác',
                color: data.color || '#005691',
                registered: registeredIds,
                status: 'SCHEDULED',
                assignments: assignments.length > 0 ? {
                    create: assignments.map((a) => ({ staffId: Number(a.staffId) }))
                } : undefined
            }
        });
    }
    async findAll() {
        const sessions = await this.prisma.liveSession.findMany({
            include: {
                assignments: {
                    include: { staff: true }
                }
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
        return this.prisma.liveSession.findUnique({
            where: { id },
            include: { assignments: { include: { staff: true } } }
        });
    }
    async update(id, data) {
        const { assignments, type, registered, ...rest } = data;
        if (type)
            rest.project = type;
        if (registered !== undefined)
            rest.registered = JSON.stringify(registered);
        if (assignments && assignments.create) {
            await this.prisma.liveSessionAssignment.deleteMany({ where: { liveSessionId: id } });
            await this.prisma.liveSessionAssignment.createMany({
                data: assignments.create.map((a) => ({ liveSessionId: id, staffId: Number(a.staffId) }))
            });
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