import { PrismaService } from '../prisma/prisma.service.js';
import { EventsGateway } from '../websocket/events.gateway.js';
export declare class QuizService {
    private readonly prisma;
    private readonly eventsGateway;
    private readonly logger;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway);
    processQuizAnswer(liveSessionId: string, comment: any): Promise<void>;
}
