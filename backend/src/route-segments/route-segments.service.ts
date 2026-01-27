import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RouteSegment, RouteSegmentStatus } from './entities/route-segment.entity';
import { CreateRouteSegmentDto, UpdateRouteSegmentDto } from './dto/route-segment.dto';

@Injectable()
export class RouteSegmentsService {
    constructor(
        @InjectRepository(RouteSegment)
        private routeSegmentRepository: Repository<RouteSegment>,
    ) { }

    async create(createDto: CreateRouteSegmentDto): Promise<RouteSegment> {
        const segment = this.routeSegmentRepository.create({
            parcel: { id: createDto.parcelId } as any,
            segmentOrder: createDto.segmentOrder,
            fromHub: { id: createDto.fromHubId } as any,
            toHub: { id: createDto.toHubId } as any,
            transportMode: { id: createDto.transportModeId } as any,
            deliveryPerson: createDto.deliveryPersonId ? { id: createDto.deliveryPersonId } as any : undefined,
            distance: createDto.distance,
            estimatedCost: createDto.estimatedCost,
            status: createDto.status || RouteSegmentStatus.PENDING,
            pickupOtp: this.generateOTP(),
            deliveryOtp: this.generateOTP(),
        });
        return this.routeSegmentRepository.save(segment);
    }

    async findByParcel(parcelId: string): Promise<RouteSegment[]> {
        return this.routeSegmentRepository.find({
            where: { parcel: { id: parcelId } },
            relations: ['fromHub', 'toHub', 'transportMode', 'deliveryPerson'],
            order: { segmentOrder: 'ASC' },
        });
    }

    async findOne(id: string): Promise<RouteSegment | null> {
        return this.routeSegmentRepository.findOne({
            where: { id },
            relations: ['parcel', 'fromHub', 'toHub', 'transportMode', 'deliveryPerson'],
        });
    }

    async update(id: string, updateDto: UpdateRouteSegmentDto): Promise<RouteSegment | null> {
        await this.routeSegmentRepository.update(id, updateDto);
        return this.findOne(id);
    }

    async completeSegment(id: string, otp: string): Promise<RouteSegment> {
        const segment = await this.findOne(id);

        if (!segment) {
            throw new Error('Segment not found');
        }

        if (segment.deliveryOtp !== otp) {
            throw new Error('Invalid OTP');
        }

        segment.status = RouteSegmentStatus.COMPLETED;
        segment.deliveryTime = new Date();

        return this.routeSegmentRepository.save(segment);
    }

    async assignDeliveryPerson(segmentId: string, deliveryPersonId: string): Promise<RouteSegment> {
        const segment = await this.findOne(segmentId);
        if (!segment) {
            throw new Error('Segment not found');
        }
        segment.deliveryPerson = { id: deliveryPersonId } as any;
        segment.status = RouteSegmentStatus.ASSIGNED;
        return this.routeSegmentRepository.save(segment);
    }

    async startSegment(id: string, otp: string): Promise<RouteSegment> {
        const segment = await this.findOne(id);

        if (!segment) {
            throw new Error('Segment not found');
        }

        if (segment.pickupOtp !== otp) {
            throw new Error('Invalid pickup OTP');
        }

        segment.status = RouteSegmentStatus.IN_TRANSIT;
        segment.pickupTime = new Date();

        return this.routeSegmentRepository.save(segment);
    }

    private generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async findByDeliveryPerson(deliveryPersonId: string, status?: RouteSegmentStatus): Promise<RouteSegment[]> {
        const where: any = { deliveryPerson: { id: deliveryPersonId } };
        if (status) {
            where.status = status;
        }

        return this.routeSegmentRepository.find({
            where,
            relations: ['parcel', 'fromHub', 'toHub', 'transportMode'],
            order: { createdAt: 'DESC' },
        });
    }
}
