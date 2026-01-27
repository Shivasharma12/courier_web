import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackingLog } from './entities/tracking-log.entity';
import { Parcel } from '../parcels/entities/parcel.entity';
import { TrackingGateway } from './tracking.gateway';

@Injectable()
export class TrackingService {
    constructor(
        @InjectRepository(TrackingLog)
        private trackingLogRepository: Repository<TrackingLog>,
        private trackingGateway: TrackingGateway,
    ) { }

    async createLog(parcel: Parcel, status: string, description: string, lat?: number, lng?: number) {
        const log = this.trackingLogRepository.create({
            parcel,
            status,
            description,
            lat,
            lng,
        });
        const savedLog = await this.trackingLogRepository.save(log);

        // Notify real-time listeners
        if (this.trackingGateway.server) {
            this.trackingGateway.server.to(parcel.trackingNumber).emit('logUpdated', {
                ...savedLog,
                parcel: undefined // Avoid circular references or leaking unnecessary data
            });
        }

        return savedLog;
    }

    async findByParcel(parcelId: string) {
        return this.trackingLogRepository.find({
            where: { parcel: { id: parcelId } },
            order: { timestamp: 'DESC' },
        });
    }
}
