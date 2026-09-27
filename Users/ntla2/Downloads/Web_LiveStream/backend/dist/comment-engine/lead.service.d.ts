import { PrismaService } from '../prisma/prisma.service.js';
import { EventsGateway } from '../websocket/events.gateway.js';
export declare class LeadService {
    private readonly prisma;
    private readonly eventsGateway;
    private readonly logger;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway);
    processPotentialLead(liveSessionId: string, comment: any, customerId: string, classification: {
        intent: string | null;
        score: number;
    }): Promise<void>;
}
