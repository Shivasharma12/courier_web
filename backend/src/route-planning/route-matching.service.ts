import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parcel } from '../parcels/entities/parcel.entity';
import { User } from '../users/entities/user.entity';

export interface MatchedParcel {
    parcel: Parcel;
    matchType: 'exact' | 'along-route';
    distance: number;
}

@Injectable()
export class RouteMatchingService {
    constructor(
        @InjectRepository(Parcel)
        private parcelRepository: Repository<Parcel>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    /**
     * Calculate distance between two points using Haversine formula
     * Returns distance in kilometers
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Calculate perpendicular distance from a point to a line segment
     * Used to check if parcel is along the route
     */
    private distanceToLineSegment(
        pointLat: number,
        pointLon: number,
        startLat: number,
        startLon: number,
        endLat: number,
        endLon: number
    ): number {
        // Calculate distances
        const distToStart = this.calculateDistance(pointLat, pointLon, startLat, startLon);
        const distToEnd = this.calculateDistance(pointLat, pointLon, endLat, endLon);
        const routeLength = this.calculateDistance(startLat, startLon, endLat, endLon);

        // If point is very close to start or end, return that distance
        if (distToStart < 1) return distToStart;
        if (distToEnd < 1) return distToEnd;

        // Use simplified perpendicular distance calculation
        // For more accuracy, we'd need proper projection, but this works for our use case
        const a = distToStart;
        const b = distToEnd;
        const c = routeLength;

        // Check if point forms a valid triangle with the route
        if (a + b <= c || a + c <= b || b + c <= a) {
            return Math.min(distToStart, distToEnd);
        }

        // Calculate perpendicular distance using Heron's formula
        const s = (a + b + c) / 2;
        const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
        const perpDistance = (2 * area) / c;

        return perpDistance;
    }

    /**
     * Find parcels matching a traveler's route
     */
    async findMatchingParcels(travelerId: string): Promise<MatchedParcel[]> {
        // Get traveler details
        const traveler = await this.userRepository.findOne({
            where: { id: travelerId }
        });

        if (!traveler || !traveler.travelStartLat || !traveler.travelEndLat) {
            return [];
        }

        // Get all pending parcels
        const parcels = await this.parcelRepository.find({
            where: { status: 'pending' },
            relations: ['sender']
        });

        const matches: MatchedParcel[] = [];

        for (const parcel of parcels) {
            if (!parcel.senderLat || !parcel.receiverLat) continue;

            // Check for exact destination match (within 5km)
            const distanceToDestination = this.calculateDistance(
                parcel.receiverLat,
                parcel.receiverLng,
                traveler.travelEndLat,
                traveler.travelEndLng
            );

            if (distanceToDestination <= 5) {
                matches.push({
                    parcel,
                    matchType: 'exact',
                    distance: distanceToDestination
                });
                continue;
            }

            // Check if pickup or drop is along the route (within 10km)
            const pickupDistanceToRoute = this.distanceToLineSegment(
                parcel.senderLat,
                parcel.senderLng,
                traveler.travelStartLat,
                traveler.travelStartLng,
                traveler.travelEndLat,
                traveler.travelEndLng
            );

            const dropDistanceToRoute = this.distanceToLineSegment(
                parcel.receiverLat,
                parcel.receiverLng,
                traveler.travelStartLat,
                traveler.travelStartLng,
                traveler.travelEndLat,
                traveler.travelEndLng
            );

            const minDistance = Math.min(pickupDistanceToRoute, dropDistanceToRoute);

            if (minDistance <= 10) {
                matches.push({
                    parcel,
                    matchType: 'along-route',
                    distance: minDistance
                });
            }
        }

        // Sort by distance (closest first)
        matches.sort((a, b) => a.distance - b.distance);

        return matches;
    }
}
