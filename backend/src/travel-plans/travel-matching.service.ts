import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Parcel } from '../parcels/entities/parcel.entity';
import { TravelPlan } from '../travel-plans/entities/travel-plan.entity';
import { ParcelStatus } from '../common/enums/parcel-status.enum';
import { TravelPlanStatus } from '../common/enums/travel-plan-status.enum';
import { NotificationsService } from '../common/notifications.service';
import { TrackingService } from '../tracking/tracking.service';

export interface MatchedParcel {
    parcel: Parcel;
    matchType: 'direct' | 'on-the-way' | 'proximity';
    travelPlan: TravelPlan;
    pickupHubDistance?: number;
    deliveryHubDistance?: number;
}

const isSimilar = (a: string, b: string) => {
    if (!a || !b) return false;
    const s1 = a.toLowerCase().trim();
    const s2 = b.toLowerCase().trim();
    if (s1 === s2) return true;
    const aFirst = s1.split(',')[0].trim();
    const bFirst = s2.split(',')[0].trim();
    if (aFirst && bFirst && aFirst === bFirst && aFirst.length > 2) return true;
    return s1.includes(bFirst) || s2.includes(aFirst);
};

@Injectable()
export class TravelMatchingService {
    constructor(
        @InjectRepository(Parcel)
        private parcelRepository: Repository<Parcel>,
        @InjectRepository(TravelPlan)
        private travelPlanRepository: Repository<TravelPlan>,
        private notificationsService: NotificationsService,
        private trackingService: TrackingService,
    ) { }

    /**
     * Find parcels that match a specific travel plan strictly
     */
    async findMatchingParcels(travelPlanId: string): Promise<MatchedParcel[]> {
        const travelPlan = await this.travelPlanRepository.findOne({
            where: { id: travelPlanId },
            relations: ['startHub', 'endHub']
        });

        if (!travelPlan) return [];

        const parcels = await this.parcelRepository.find({
            where: {
                status: In([ParcelStatus.PENDING_MATCH, ParcelStatus.AT_HUB]),
                assignedTo: null as any
            },
            relations: ['sender', 'currentHub', 'destinationHub']
        });

        const matches: MatchedParcel[] = [];

        for (const parcel of parcels) {
            let isMatch = false;
            let matchType: 'direct' | 'proximity' | 'on-the-way' = 'direct';
            let pickupHubDistance: number | undefined;
            let deliveryHubDistance: number | undefined;

            // Calculate base distances if coords are available
            if (travelPlan.fromLat && travelPlan.fromLng && parcel.currentHub?.lat && parcel.currentHub?.lng) {
                pickupHubDistance = this.calculateDistance(travelPlan.fromLat, travelPlan.fromLng, parcel.currentHub.lat, parcel.currentHub.lng);
            }
            if (travelPlan.toLat && travelPlan.toLng && parcel.destinationHub?.lat && parcel.destinationHub?.lng) {
                deliveryHubDistance = this.calculateDistance(travelPlan.toLat, travelPlan.toLng, parcel.destinationHub.lat, parcel.destinationHub.lng);
            }

            // 1. Exact Hub Match (Start and End Hubs)
            if (travelPlan.startHub && travelPlan.endHub && parcel.currentHub && parcel.destinationHub) {
                if (parcel.currentHub.id === travelPlan.startHub.id && parcel.destinationHub.id === travelPlan.endHub.id) {
                    isMatch = true;
                    matchType = 'direct';
                }
            }

            // 2. Intermediate Hub Match ("On the way")
            // If the parcel is at a hub that is geographically between the traveler's start and end points
            if (!isMatch && travelPlan.fromLat && travelPlan.toLat && parcel.currentHub?.lat && parcel.destinationHub?.lat) {
                const totalRouteDist = this.calculateDistance(travelPlan.fromLat, travelPlan.fromLng, travelPlan.toLat, travelPlan.toLng);
                const distToParcelHub = this.calculateDistance(travelPlan.fromLat, travelPlan.fromLng, parcel.currentHub.lat, parcel.currentHub.lng);
                const distFromParcelHubToDest = this.calculateDistance(parcel.currentHub.lat, parcel.currentHub.lng, travelPlan.toLat, travelPlan.toLng);

                // If picking up at this hub and going to the traveler's destination only adds 20% distance
                // AND the parcel's destination is the traveler's destination (or near it)
                const isParcelHubOnRoute = (distToParcelHub + distFromParcelHubToDest) < (totalRouteDist * 1.2);
                const isDestinationMatch = parcel.destinationHub.id === travelPlan.endHub?.id ||
                    this.calculateDistance(parcel.destinationHub.lat, parcel.destinationHub.lng, travelPlan.toLat, travelPlan.toLng) < 10;

                if (isParcelHubOnRoute && isDestinationMatch) {
                    isMatch = true;
                    matchType = 'on-the-way';
                }
            }

            // 3. Flexible String Match (Current fallback)
            if (!isMatch) {
                const startMatches = isSimilar(parcel.senderAddress, travelPlan.fromLocation) || (travelPlan.startHub && parcel.currentHub?.id === travelPlan.startHub.id);
                const endMatches = isSimilar(parcel.receiverAddress, travelPlan.toLocation) || (travelPlan.endHub && parcel.destinationHub?.id === travelPlan.endHub.id);

                if (startMatches && endMatches) {
                    isMatch = true;
                    matchType = 'direct';
                }
            }

            if (isMatch) {
                matches.push({
                    parcel,
                    matchType: matchType as any,
                    travelPlan,
                    pickupHubDistance,
                    deliveryHubDistance
                });
            }
        }

        return matches;
    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Traveler accepts a parcel matching their route
     */
    async assignParcel(parcelId: string, travelPlanId: string): Promise<Parcel> {
        const parcel = await this.parcelRepository.findOne({
            where: { id: parcelId },
            relations: ['sender', 'currentHub', 'destinationHub']
        });

        const travelPlan = await this.travelPlanRepository.findOne({
            where: { id: travelPlanId },
            relations: ['user', 'startHub', 'endHub']
        });

        if (!parcel || !travelPlan) {
            throw new Error('Parcel or Travel Plan not found');
        }

        // Final strict check before assignment
        if (!isSimilar(parcel.senderAddress, travelPlan.fromLocation) ||
            !isSimilar(parcel.receiverAddress, travelPlan.toLocation)) {
            throw new Error('Route mismatch: Cannot accept this parcel');
        }

        // Assign the parcel to the traveler
        parcel.assignedTo = travelPlan.user;
        parcel.status = ParcelStatus.MATCHED;

        const hubName = travelPlan.startHub?.name || 'Local Distribution Hub';
        const hubAddress = travelPlan.startHub?.address || 'the nearest central hub';

        // Notify Customer with drop-off instructions
        if (parcel.sender) {
            this.notificationsService.notifyCustomer(
                parcel.sender.id,
                `Traveler ${travelPlan.user.name} has accepted your parcel match! Action Required: Please drop your parcel at Hub: ${hubName} (Address: ${hubAddress}).`
            );
        }

        // Tracking log
        await this.trackingService.createLog(
            parcel,
            ParcelStatus.MATCHED,
            `Traveler ${travelPlan.user.name} accepted the parcel. Awaiting drop-off at ${hubName}.`
        );

        // Decrease capacity
        travelPlan.capacity -= 1;

        await this.travelPlanRepository.save(travelPlan);
        return this.parcelRepository.save(parcel);
    }

    /**
     * Customer confirms the matching traveler
     */
    async confirmTraveler(parcelId: string): Promise<Parcel> {
        const parcel = await this.parcelRepository.findOne({
            where: { id: parcelId }
        });

        if (!parcel || parcel.status !== ParcelStatus.MATCHED) {
            throw new Error('Parcel not in MATCHED state');
        }

        parcel.status = ParcelStatus.BOOKED;
        return this.parcelRepository.save(parcel);
    }

    /**
     * Find all available travel plans for a specific parcel strictly
     */
    async findMatchingTravelPlans(parcelId: string): Promise<TravelPlan[]> {
        const parcel = await this.parcelRepository.findOne({
            where: { id: parcelId }
        });

        if (!parcel) return [];

        // Matching:
        // 1. status: ACTIVE_TRAVEL
        // 2. fromLocation matches senderAddress
        // 3. toLocation matches receiverAddress
        // 4. capacity > 0
        const travelPlans = await this.travelPlanRepository.find({
            where: {
                status: TravelPlanStatus.ACTIVE_TRAVEL
            },
            relations: ['user']
        });

        return travelPlans.filter(plan =>
            plan.capacity > 0 &&
            isSimilar(plan.fromLocation, parcel.senderAddress) &&
            isSimilar(plan.toLocation, parcel.receiverAddress)
        );
    }
}
