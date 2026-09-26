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
import { EmailService, STATUS_LABELS } from '../email/email.service.js';
let OrderService = class OrderService {
    prisma;
    emailService;
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async create(data) {
        if (data.phone) {
            const giftName = data.gift || data.giftName || '';
            const existing = await this.prisma.shipment.findFirst({
                where: { phone: data.phone, giftName }
            });
            if (existing)
                return existing;
        }
        const shipment = await this.prisma.shipment.create({
            data: {
                id: data.id || `DON-${Date.now().toString().slice(-6)}`,
                recipientName: data.recipientName || data.winnerName || '',
                phone: data.phone || '',
                address: data.address || '',
                recipientEmail: data.recipientEmail || null,
                senderName: data.senderName || 'Uống Gì Chưa',
                senderAddress: data.senderAddress || 'FPT University HCM, Lô E2a-7, Đường D1, Long Thạnh Mỹ, TP.HCM',
                status: data.status || 'PACKED',
                currentLocation: data.currentLocation || 'Kho Uống Gì Chưa',
                giftName: data.gift || data.giftName || '',
                liveSessionId: data.liveSessionId || null,
                shippingProvider: data.shippingProvider || null,
                trackingCode: data.trackingCode || null,
                trackingLink: data.trackingLink || null,
            }
        });
        await this.prisma.shipmentHistory.create({
            data: {
                shipmentId: shipment.id,
                status: shipment.status,
                location: shipment.currentLocation || 'Kho Uống Gì Chưa',
                note: 'Đơn hàng được tạo',
            }
        });
        return shipment;
    }
    async findAll(sessionId) {
        const where = sessionId ? { liveSessionId: sessionId } : {};
        const shipments = await this.prisma.shipment.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { histories: { orderBy: { timestamp: 'desc' } } }
        });
        return shipments.map(s => this.formatShipment(s));
    }
    async findOne(id) {
        const s = await this.prisma.shipment.findUnique({
            where: { id },
            include: { histories: { orderBy: { timestamp: 'desc' } } }
        });
        if (!s)
            return null;
        return this.formatShipment(s);
    }
    async findByTracking(code) {
        let s = await this.prisma.shipment.findFirst({
            where: { trackingCode: code },
            include: { histories: { orderBy: { timestamp: 'desc' } } }
        });
        if (!s) {
            s = await this.prisma.shipment.findFirst({
                where: { id: code },
                include: { histories: { orderBy: { timestamp: 'desc' } } }
            });
        }
        if (!s) {
            s = await this.prisma.shipment.findFirst({
                where: { phone: code },
                orderBy: { createdAt: 'desc' },
                include: { histories: { orderBy: { timestamp: 'desc' } } }
            });
        }
        if (!s)
            throw new NotFoundException('Không tìm thấy đơn hàng');
        return this.formatShipment(s);
    }
    async update(id, data) {
        const existing = await this.prisma.shipment.findUnique({ where: { id } });
        if (!existing)
            throw new NotFoundException('Đơn hàng không tồn tại');
        const statusChanged = data.status && data.status !== existing.status;
        const updateData = {};
        if (data.status)
            updateData.status = data.status;
        if (data.currentLocation)
            updateData.currentLocation = data.currentLocation;
        if (data.lastMileCarrier)
            updateData.lastMileCarrier = data.lastMileCarrier;
        if (data.lastMileTrackingCode)
            updateData.lastMileTrackingCode = data.lastMileTrackingCode;
        if (data.lastMileTrackingLink)
            updateData.lastMileTrackingLink = data.lastMileTrackingLink;
        if (data.shippingProvider)
            updateData.shippingProvider = data.shippingProvider;
        if (data.trackingCode)
            updateData.trackingCode = data.trackingCode;
        if (data.trackingLink)
            updateData.trackingLink = data.trackingLink;
        if (data.address)
            updateData.address = data.address;
        if (data.phone)
            updateData.phone = data.phone;
        if (data.recipientEmail)
            updateData.recipientEmail = data.recipientEmail;
        if (data.winnerName || data.recipientName) {
            updateData.recipientName = data.winnerName || data.recipientName;
        }
        if (data.gift || data.giftName)
            updateData.giftName = data.gift || data.giftName;
        const updated = await this.prisma.shipment.update({ where: { id }, data: updateData });
        if (statusChanged) {
            const statusInfo = STATUS_LABELS[data.status];
            const location = data.currentLocation || (statusInfo?.location) || data.status;
            await this.prisma.shipmentHistory.create({
                data: {
                    shipmentId: id,
                    status: data.status,
                    location,
                    note: data.note || null,
                }
            });
            this.emailService.sendStatusUpdate({ ...updated, id }, data.status)
                .catch(() => { });
        }
        return updated;
    }
    async remove(id) {
        return this.prisma.shipment.delete({ where: { id } });
    }
    async getHistory(id) {
        const histories = await this.prisma.shipmentHistory.findMany({
            where: { shipmentId: id },
            orderBy: { timestamp: 'desc' }
        });
        return histories;
    }
    formatShipment(s) {
        const statusInfo = STATUS_LABELS[s.status];
        return {
            id: s.id,
            date: s.createdAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            senderName: s.senderName || 'Uống Gì Chưa',
            senderAddress: s.senderAddress || 'FPT University HCM',
            recipient: s.recipientName || '',
            recipientName: s.recipientName || '',
            phone: s.phone || '',
            address: s.address || '',
            recipientEmail: s.recipientEmail || null,
            gift: s.giftName || 'Quà tặng',
            liveSessionId: s.liveSessionId || null,
            status: s.status,
            statusLabel: statusInfo?.label || s.status,
            currentLocation: s.currentLocation || statusInfo?.location || '',
            lastMileCarrier: s.lastMileCarrier || null,
            lastMileTrackingCode: s.lastMileTrackingCode || null,
            lastMileTrackingLink: s.lastMileTrackingLink || null,
            shippingProvider: s.shippingProvider || null,
            trackingCode: s.trackingCode || null,
            trackingLink: s.trackingLink || null,
            histories: (s.histories || []).map((h) => ({
                id: h.id,
                status: h.status,
                statusLabel: STATUS_LABELS[h.status]?.label || h.status,
                location: h.location || '',
                note: h.note || null,
                timestamp: h.timestamp,
                timeStr: new Date(h.timestamp).toLocaleString('vi-VN', {
                    hour: '2-digit', minute: '2-digit',
                    day: '2-digit', month: '2-digit', year: 'numeric'
                }),
            })),
        };
    }
};
OrderService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        EmailService])
], OrderService);
export { OrderService };
//# sourceMappingURL=order.service.js.map