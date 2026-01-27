import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Parcel } from './entities/parcel.entity';
import { User } from '../users/entities/user.entity';
import { ParcelStatus } from '../common/enums/parcel-status.enum';

@Injectable()
export class MatchingService {
    constructor(
        @InjectRepository(Parcel)
        private parcelsRepository: Repository<Parcel>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findMatchesForTraveler(travelerId: string) {
        const traveler = await this.usersRepository.findOne({ where: { id: travelerId } });
        if (!traveler || !traveler.travelStartLat) return [];

        // Matching logic:
        // 1. Find parcels whose pickup is near traveler start OR dropoff is near traveler end
        // 2. OR parcels that are "along the way" (simplified as within a bounding box)

        const threshold = 1.0; // 1 degree ~ 111km, simplified proximity

        const matches = await this.parcelsRepository.find({
            where: {
                status: ParcelStatus.PENDING_MATCH,
                senderLat: Between(traveler.travelStartLat - threshold, traveler.travelStartLat + threshold),
                senderLng: Between(traveler.travelStartLng - threshold, traveler.travelStartLng + threshold),
            },
            relations: ['sender', 'currentHub', 'destinationHub']
        });

        // Filter by transport mode capability
        return matches.filter(parcel => {
            const weight = parcel.weight || 0;
            const volume = (parcel.length || 0) * (parcel.width || 0) * (parcel.height || 0) / 1000000; // m3

            switch (traveler.vehicleType) {
                case 'bike':
                    return weight <= 10 && volume <= 0.05;
                case 'car':
                    return weight <= 100 && volume <= 1.5;
                case 'bus':
                    return weight <= 2000;
                case 'flight':
                    return true; // Flights can take most things if they fit
                default:
                    return weight <= 5;
            }
        });
    }

    async getSystemAnalytics() {
        // Global stats for admin
        const total = await this.parcelsRepository.count();
        const pending = await this.parcelsRepository.count({ where: { status: ParcelStatus.PENDING_MATCH } });
        const matched = await this.parcelsRepository.count({ where: { status: ParcelStatus.IN_TRANSIT } });

        return {
            totalParcels: total,
            pendingMatching: pending,
            activeTransfers: matched,
            matchingEfficiency: total > 0 ? ((matched / total) * 100).toFixed(1) : 0
        };
    }
}
