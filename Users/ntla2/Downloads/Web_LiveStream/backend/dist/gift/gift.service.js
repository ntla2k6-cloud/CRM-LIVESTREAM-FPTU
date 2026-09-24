var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
let GiftService = class GiftService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(data) {
        return this.prisma.gift.create({ data });
    }
    findAll() {
        return this.prisma.gift.findMany({ orderBy: { id: 'desc' } });
    }
    async findOne(id) {
        const gift = await this.prisma.gift.findUnique({ where: { id } });
        if (!gift)
            throw new NotFoundException('Gift not found');
        return gift;
    }
    update(id, data) {
        return this.prisma.gift.update({ where: { id }, data });
    }
    remove(id) {
        return this.prisma.gift.delete({ where: { id } });
    }
};
GiftService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], GiftService);
export { GiftService };
//# sourceMappingURL=gift.service.js.map