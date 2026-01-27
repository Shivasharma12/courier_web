import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parcel } from './entities/parcel.entity';
import { ParcelStatus } from '../common/enums/parcel-status.enum';
import { User } from '../users/entities/user.entity';
import { TravelMatchingService } from '../travel-plans/travel-matching.service';
import { NotificationsService } from '../common/notifications.service';
import { TrackingService } from '../tracking/tracking.service';

@Injectable()
export class ParcelsService {
    constructor(
        @InjectRepository(Parcel)
        private parcelsRepository: Repository<Parcel>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private travelMatchingService: TravelMatchingService,
        private notificationsService: NotificationsService,
        private trackingService: TrackingService,
    ) { }

    async create(parcelData: any, senderId: string) {
        const sender = await this.usersRepository.findOne({ where: { id: senderId } });
        if (!sender) throw new NotFoundException('Sender not found');

        const trackingNumber = 'TRK' + Date.now().toString().slice(-10);
        // Simple pricing logic: weight * 10
        const price = (parcelData.weight || 1) * 10;

        const { destinationHubId, ...rest } = parcelData;

        const parcel = this.parcelsRepository.create({
            ...rest,
            sender: { id: senderId } as any,
            senderName: sender.name,
            senderPhone: sender.phone,
            trackingNumber,
            price,
            status: ParcelStatus.PENDING_MATCH,
            destinationHub: { id: destinationHubId } as any,
        });

        const savedParcel: any = await this.parcelsRepository.save(parcel);

        // Initial Tracking Log
        await this.trackingService.createLog(
            savedParcel,
            ParcelStatus.PENDING_MATCH,
            'Parcel created. Waiting for a traveler match.'
        );

        // Check for matches immediately
        const travelPlans = await this.travelMatchingService.findMatchingTravelPlans(savedParcel.id);
        if (travelPlans.length > 0) {
            this.notificationsService.notifyCustomer(senderId, `A traveler is available for your parcel from ${savedParcel.senderAddress} to ${savedParcel.receiverAddress}`);
            travelPlans.forEach(plan => {
                this.notificationsService.notifyTraveler(plan.user.id, `A parcel matches your route from ${plan.fromLocation || plan.startHub?.name} to ${plan.toLocation || plan.endHub?.name}`);
            });
        }

        return savedParcel;
    }

    findAll() {
        return this.parcelsRepository.find({ relations: ['sender', 'currentHub', 'destinationHub'] });
    }

    async findOneByTracking(trackingNumber: string) {
        const parcel = await this.parcelsRepository.findOne({
            where: { trackingNumber },
            relations: ['sender', 'currentHub', 'destinationHub', 'assignedTo'],
        });
        if (!parcel) throw new NotFoundException('Parcel not found');
        return parcel;
    }

    findBySender(senderId: string) {
        return this.parcelsRepository.find({
            where: { sender: { id: senderId } },
            relations: ['currentHub', 'destinationHub', 'assignedTo'],
        });
    }

    findByHub(hubId: string) {
        return this.parcelsRepository.find({
            where: { currentHub: { id: hubId } },
            relations: ['sender', 'destinationHub'],
        });
    }

    async updateStatus(id: string, status: ParcelStatus) {
        await this.parcelsRepository.update(id, { status });
        const parcel = await this.parcelsRepository.findOne({
            where: { id },
            relations: ['sender', 'destinationHub', 'currentHub', 'assignedTo']
        });

        if (!parcel) return null;

        // Create Tracking Log
        let description = `Parcel status updated to ${status.replace('_', ' ')}.`;
        if (status === ParcelStatus.AT_HUB) {
            description = `Parcel arrived at hub: ${parcel.currentHub?.name || 'Local Hub'}`;
        } else if (status === ParcelStatus.IN_TRANSIT) {
            description = `Parcel is in transit with traveler ${parcel.assignedTo?.name || 'Partner'}`;
        } else if (status === ParcelStatus.DELIVERED) {
            description = `Parcel delivered successfully.`;
        }

        await this.trackingService.createLog(parcel, status, description);

        if (status === ParcelStatus.DELIVERED) {
            // Notify Customer
            if (parcel.sender) {
                this.notificationsService.notifyCustomer(
                    parcel.sender.id,
                    `Your parcel (Tracking: ${parcel.trackingNumber}) has been successfully delivered!`
                );
            }

            // Notify Hub Managers of the destination hub
            if (parcel.destinationHub) {
                const managers = await this.usersRepository.find({
                    where: {
                        role: 'hub_manager',
                        hubId: parcel.destinationHub.id
                    }
                });

                managers.forEach(manager => {
                    this.notificationsService.notifyHubManager(
                        manager.id,
                        `Parcel ${parcel.trackingNumber} has been delivered at its destination: ${parcel.destinationHub.name}.`
                    );
                });
            }
        }

        return parcel;
    }

    async confirmHubDropoff(parcelId: string, hubId: string) {
        await this.parcelsRepository.update(parcelId, {
            status: ParcelStatus.AT_HUB,
            currentHub: { id: hubId } as any
        });
        return this.updateStatus(parcelId, ParcelStatus.AT_HUB);
    }

    async confirmHubPickup(parcelId: string) {
        return this.updateStatus(parcelId, ParcelStatus.IN_TRANSIT);
    }

    async getTrackingLogs(id: string) {
        return this.trackingService.findByParcel(id);
    }

    async findByAssignedUser(userId: string) {
        return this.parcelsRepository.find({
            where: { assignedTo: { id: userId } },
            relations: ['sender', 'currentHub', 'destinationHub'],
        });
    }
}
