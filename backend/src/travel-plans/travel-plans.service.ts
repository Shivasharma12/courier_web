import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { TravelPlan } from './entities/travel-plan.entity';
import { TravelPlanStatus } from '../common/enums/travel-plan-status.enum';
import { TravelMatchingService } from './travel-matching.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Parcel } from '../parcels/entities/parcel.entity';

@Injectable()
export class TravelPlansService {
    constructor(
        @InjectRepository(TravelPlan)
        private travelPlanRepository: Repository<TravelPlan>,
        @InjectRepository(Parcel)
        private parcelRepository: Repository<Parcel>,
        private travelMatchingService: TravelMatchingService,
        private notificationsService: NotificationsService,
    ) { }

    async create(userId: string, data: any) {
        const plan = this.travelPlanRepository.create({
            ...data,
            user: { id: userId },
            fromLocation: data.fromLocation,
            fromLat: data.fromLat,
            fromLng: data.fromLng,
            toLocation: data.toLocation,
            toLat: data.toLat,
            toLng: data.toLng,
            startHub: data.startHubId ? { id: data.startHubId } : null,
            endHub: data.endHubId ? { id: data.endHubId } : null,
            status: TravelPlanStatus.ACTIVE_TRAVEL,
        });

        const savedPlan: any = await this.travelPlanRepository.save(plan);
        const fullPlan = await this.findOne(savedPlan.id);

        // Check for matches immediately
        const matches = await this.travelMatchingService.findMatchingParcels(fullPlan.id);
        if (matches.length > 0) {
            this.notificationsService.notifyTraveler(userId, `A parcel matches your route from ${fullPlan.fromLocation} to ${fullPlan.toLocation}`);
            matches.forEach(match => {
                this.notificationsService.notifyCustomer(match.parcel.sender.id, `A traveler is available for your parcel from ${match.parcel.currentHub?.name || 'pickup'} to ${match.parcel.destinationHub?.name || 'destination'}`);
            });
        }

        return fullPlan;
    }

    async findAll() {
        const plans = await this.travelPlanRepository.find({
            relations: ['user', 'startHub', 'endHub'],
            order: { travelDate: 'ASC' }
        });

        const enhancedPlans: any[] = [];
        for (const plan of plans) {
            let matchedParcels: Parcel[] = [];
            if (plan.user) {
                // Fetch parcels assigned to this traveler
                matchedParcels = await this.parcelRepository.find({
                    where: { assignedTo: { id: plan.user.id } },
                    relations: ['sender', 'currentHub', 'destinationHub']
                });
            }
            enhancedPlans.push({
                ...plan,
                matchedParcels
            });
        }

        return enhancedPlans;
    }

    async findByUser(userId: string) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return this.travelPlanRepository.find({
            where: {
                user: { id: userId },
                createdAt: MoreThan(twentyFourHoursAgo)
            },
            order: { createdAt: 'DESC' }
        });
    }

    async findActive() {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return this.travelPlanRepository.find({
            where: {
                status: TravelPlanStatus.ACTIVE_TRAVEL,
                createdAt: MoreThan(twentyFourHoursAgo)
            },
            relations: ['user'],
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: string) {
        const plan = await this.travelPlanRepository.findOne({
            where: { id },
            relations: ['user']
        });
        if (!plan) throw new NotFoundException('Travel plan not found');
        return plan;
    }

    async update(id: string, data: any) {
        await this.findOne(id);
        await this.travelPlanRepository.update(id, data);
        return this.findOne(id);
    }

    async remove(id: string) {
        const plan = await this.findOne(id);
        return this.travelPlanRepository.remove(plan);
    }
}
