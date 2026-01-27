import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hub } from '../hubs/entities/hub.entity';
import { TransportMode, TransportType } from '../transport-modes/entities/transport-mode.entity';
import { RouteSegmentsService } from '../route-segments/route-segments.service';
import { CreateRouteSegmentDto } from '../route-segments/dto/route-segment.dto';

interface RouteNode {
    hub: Hub;
    distance: number;
    parent: RouteNode | null;
}

@Injectable()
export class RoutePlanningService {
    constructor(
        @InjectRepository(Hub)
        private hubRepository: Repository<Hub>,
        @InjectRepository(TransportMode)
        private transportModeRepository: Repository<TransportMode>,
        private routeSegmentsService: RouteSegmentsService,
    ) { }

    async planRoute(
        parcelId: string,
        startHubId: string,
        destinationHubId: string,
        preferredTransportType?: TransportType,
    ): Promise<CreateRouteSegmentDto[]> {
        const allHubs = await this.hubRepository.find();
        const startHub = allHubs.find(h => h.id === startHubId);
        const destHub = allHubs.find(h => h.id === destinationHubId);

        if (!startHub || !destHub) {
            throw new Error('Invalid hub IDs');
        }

        // If start and destination are the same, no route needed
        if (startHubId === destinationHubId) {
            return [];
        }

        // Find shortest path using Dijkstra-like algorithm
        const path = this.findShortestPath(startHub, destHub, allHubs);

        // Convert path to route segments
        const segments: CreateRouteSegmentDto[] = [];

        for (let i = 0; i < path.length - 1; i++) {
            const fromHub = path[i];
            const toHub = path[i + 1];
            const distance = this.calculateDistance(fromHub, toHub);

            // Select appropriate transport mode
            const transportMode = await this.selectTransportMode(distance, preferredTransportType);

            segments.push({
                parcelId,
                segmentOrder: i + 1,
                fromHubId: fromHub.id,
                toHubId: toHub.id,
                transportModeId: transportMode.id,
                distance,
                estimatedCost: distance * transportMode.costPerKm,
            });
        }

        return segments;
    }

    async createRouteForParcel(
        parcelId: string,
        startHubId: string,
        destinationHubId: string,
        preferredTransportType?: TransportType,
    ): Promise<void> {
        const segments = await this.planRoute(parcelId, startHubId, destinationHubId, preferredTransportType);

        for (const segment of segments) {
            await this.routeSegmentsService.create(segment);
        }
    }

    private findShortestPath(start: Hub, destination: Hub, allHubs: Hub[]): Hub[] {
        // Simple implementation: direct route or through nearest hub
        // In production, use proper graph algorithms like Dijkstra's

        const directDistance = this.calculateDistance(start, destination);

        // If distance is less than 500km, go direct
        if (directDistance < 500) {
            return [start, destination];
        }

        // Otherwise, find intermediate hub
        let bestPath = [start, destination];
        let shortestDistance = directDistance;

        for (const intermediateHub of allHubs) {
            if (intermediateHub.id === start.id || intermediateHub.id === destination.id) {
                continue;
            }

            const dist1 = this.calculateDistance(start, intermediateHub);
            const dist2 = this.calculateDistance(intermediateHub, destination);
            const totalDist = dist1 + dist2;

            if (totalDist < shortestDistance) {
                shortestDistance = totalDist;
                bestPath = [start, intermediateHub, destination];
            }
        }

        return bestPath;
    }

    private calculateDistance(hub1: Hub, hub2: Hub): number {
        // Haversine formula for distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(hub2.lat - hub1.lat);
        const dLon = this.toRad(hub2.lng - hub1.lng);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(hub1.lat)) * Math.cos(this.toRad(hub2.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    private async selectTransportMode(distance: number, preferredType?: TransportType): Promise<TransportMode> {
        const allModes = await this.transportModeRepository.find({ where: { isActive: true } });

        // If preferred type is specified and available, use it
        if (preferredType) {
            const preferred = allModes.find(m => m.type === preferredType);
            if (preferred) return preferred;
        }

        // Auto-select based on distance
        if (distance < 50) {
            return allModes.find(m => m.type === TransportType.BIKE) || allModes[0];
        } else if (distance < 200) {
            return allModes.find(m => m.type === TransportType.VAN) || allModes[0];
        } else if (distance < 1000) {
            return allModes.find(m => m.type === TransportType.TRUCK) || allModes[0];
        } else if (distance < 2000) {
            return allModes.find(m => m.type === TransportType.TRAIN) || allModes[0];
        } else {
            return allModes.find(m => m.type === TransportType.AIR) || allModes[0];
        }
    }

    async calculateEstimatedDeliveryTime(parcelId: string): Promise<Date> {
        const segments = await this.routeSegmentsService.findByParcel(parcelId);

        let totalHours = 0;
        for (const segment of segments) {
            const hours = segment.distance / segment.transportMode.avgSpeed;
            totalHours += hours + 2; // Add 2 hours for hub processing
        }

        const estimatedDate = new Date();
        estimatedDate.setHours(estimatedDate.getHours() + totalHours);

        return estimatedDate;
    }
}
