import { PrismaService } from '../prisma/prisma.service.js';
import { CommentPayload } from './comment-source.interface.js';
import { QuizService } from './quiz.service.js';
import { LeadService } from './lead.service.js';
import { EventsGateway } from '../websocket/events.gateway.js';
export declare class PipelineService {
    private readonly prisma;
    private readonly quizService;
    private readonly leadService;
    private readonly eventsGateway;
    private readonly logger;
    constructor(prisma: PrismaService, quizService: QuizService, leadService: LeadService, eventsGateway: EventsGateway);
    processComment(liveSessionId: string, payload: CommentPayload): Promise<void>;
    private classifyComment;
}
