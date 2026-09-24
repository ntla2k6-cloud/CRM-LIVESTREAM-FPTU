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
let OrderService = class OrderService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.shipment.create({
            data: {
                id: data.id || `DON-${Date.now().toString().slice(-6)}`,
                recipientName: data.winnerName || data.recipientName || '',
                phone: data.phone || '',
                address: data.address || '',
                status: data.status || 'Đã tạo đơn',
                giftName: data.gift || '',
                shippingProvider: data.shippingProvider,
                trackingCode: data.trackingCode
            }
        });
    }
    async findAll() {
        const shipments = await this.prisma.shipment.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return shipments.map(s => ({
            id: s.id,
            date: s.createdAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            recipient: s.recipientName,
            phone: s.phone,
            address: s.address,
            gift: s.giftName || 'Quà tặng',
            status: s.status,
            shippingProvider: s.shippingProvider,
            trackingCode: s.trackingCode
        }));
    }
    async findOne(id) {
        return this.prisma.shipment.findUnique({ where: { id } });
    }
    async findByTracking(trackingCode) {
        return this.prisma.shipment.findFirst({ where: { trackingCode } });
    }
    async update(id, data) {
        const updateData = {};
        if (data.status)
            updateData.status = data.status;
        if (data.shippingProvider)
            updateData.shippingProvider = data.shippingProvider;
        if (data.trackingCode)
            updateData.trackingCode = data.trackingCode;
        if (data.address)
            updateData.address = data.address;
        if (data.phone)
            updateData.phone = data.phone;
        if (data.winnerName)
            updateData.recipientName = data.winnerName;
        if (data.gift)
            updateData.giftName = data.gift;
        return this.prisma.shipment.update({
            where: { id },
            data: updateData
        });
    }
    async remove(id) {
        return this.prisma.shipment.delete({ where: { id } });
    }
};
OrderService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], OrderService);
export { OrderService };
//# sourceMappingURL=order.service.js.map