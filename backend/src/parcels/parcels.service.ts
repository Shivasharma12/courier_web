import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
        const price = (parcelData.weight || 1) * 10;

        const { destinationHubId, currentHubId, ...rest } = parcelData;

        const parcel = this.parcelsRepository.create({
            ...rest,
            sender: { id: senderId } as any,
            senderName: sender.name,
            senderPhone: sender.phone,
            trackingNumber,
            price,
            status: currentHubId ? ParcelStatus.AT_HUB : ParcelStatus.PENDING_MATCH,
            destinationHub: { id: destinationHubId } as any,
            currentHub: currentHubId ? { id: currentHubId } as any : null,
        });

        const savedParcel: any = await this.parcelsRepository.save(parcel);

        // Initial Tracking Log
        const currentStatus = currentHubId ? ParcelStatus.AT_HUB : ParcelStatus.PENDING_MATCH;
        const logDescription = currentHubId
            ? `Parcel dropped at hub. Searching for matching global traveler.`
            : 'Parcel created. Waiting for pickup or traveler match.';

        await this.trackingService.createLog(savedParcel, currentStatus, logDescription);

        // ── Notify hub manager of this hub that a new parcel is incoming ──
        if (currentHubId) {
            const hubManagers = await this.usersRepository.find({ where: { hubId: currentHubId, role: 'hub_manager' } });
            for (const mgr of hubManagers) {
                await this.notificationsService.create(
                    mgr.id,
                    '📦 New Parcel Incoming',
                    `A new parcel (#${trackingNumber}) has been sent to your hub. Please add it to inventory when received.`,
                    'info',
                    '/hub/inventory',
                );
            }
        }

        // ── Also notify destination hub manager ──
        if (destinationHubId && destinationHubId !== currentHubId) {
            const destManagers = await this.usersRepository.find({ where: { hubId: destinationHubId, role: 'hub_manager' } });
            for (const mgr of destManagers) {
                await this.notificationsService.create(
                    mgr.id,
                    '📦 Parcel En Route to Your Hub',
                    `Parcel #${trackingNumber} is heading to your hub. It will arrive shortly.`,
                    'info',
                    '/hub/inventory',
                );
            }
        }

        // ── Check for traveler matches ──
        const travelPlans = await this.travelMatchingService.findMatchingTravelPlans(savedParcel.id);
        if (travelPlans.length > 0) {
            await this.notificationsService.create(
                senderId,
                '🎯 Traveler Match Found!',
                `A traveler is available for your parcel from ${savedParcel.senderAddress} to ${savedParcel.receiverAddress}.`,
                'success',
                `/customer/track?tracking=${trackingNumber}`,
            );
            for (const plan of travelPlans) {
                await this.notificationsService.create(
                    plan.user.id,
                    '📦 Parcel Match Available',
                    `A parcel matches your route from ${plan.fromLocation || plan.startHub?.name} to ${plan.toLocation || plan.endHub?.name}.`,
                    'info',
                    `/hub/inventory`,
                );
            }
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
            order: { createdAt: 'DESC' },
        });
    }

    findByHub(hubId: string) {
        return this.parcelsRepository.find({
            where: {
                currentHub: { id: hubId },
                status: ParcelStatus.AT_HUB,
            },
            relations: ['sender', 'destinationHub'],
            order: { createdAt: 'DESC' },
        });
    }

    /** Find parcels destined for this hub that haven't physically arrived here yet */
    findIncomingForHub(hubId: string) {
        return this.parcelsRepository
            .createQueryBuilder('parcel')
            .leftJoinAndSelect('parcel.sender', 'sender')
            .leftJoinAndSelect('parcel.currentHub', 'currentHub')
            .where('parcel.destination_hub_id = :hubId', { hubId })
            .andWhere('parcel.status IN (:...statuses)', {
                statuses: [
                    ParcelStatus.PENDING_MATCH,
                    ParcelStatus.MATCHED,
                    ParcelStatus.BOOKED,
                    ParcelStatus.PICKED_UP,
                    ParcelStatus.AT_HUB,
                    ParcelStatus.IN_TRANSIT,
                ],
            })
            // Exclude parcels already AT this hub (they show in the At Hub tab)
            .andWhere('(parcel.current_hub_id != :hubId OR parcel.current_hub_id IS NULL)', { hubId })
            .orderBy('parcel.updatedAt', 'DESC')
            .getMany();
    }

    async updateStatus(id: string, status: ParcelStatus) {
        await this.parcelsRepository.update(id, { status });
        const parcel = await this.parcelsRepository.findOne({
            where: { id },
            relations: ['sender', 'destinationHub', 'currentHub', 'assignedTo']
        });

        if (!parcel) return null;

        // ── Tracking log ──
        let description = `Parcel status updated to ${status.replace(/_/g, ' ')}.`;
        if (status === ParcelStatus.AT_HUB) {
            description = `Parcel received and added to inventory at hub: ${parcel.currentHub?.name || 'Hub'}`;
        } else if (status === ParcelStatus.IN_TRANSIT) {
            description = `Parcel picked up by traveler ${parcel.assignedTo?.name || 'Partner'} and is now in transit.`;
        } else if (status === ParcelStatus.OUT_FOR_DELIVERY) {
            description = `Parcel is out for final delivery.`;
        } else if (status === ParcelStatus.DELIVERED) {
            description = `Parcel delivered successfully to ${parcel.receiverName}.`;
        }

        await this.trackingService.createLog(parcel, status, description);

        const tn = parcel.trackingNumber;
        const trackLink = `/customer/track?tracking=${tn}`;

        // ── Status-specific notifications ──
        if (status === ParcelStatus.AT_HUB) {
            // Parcel added to inventory — notify sender
            if (parcel.sender) {
                await this.notificationsService.create(
                    parcel.sender.id,
                    '✅ Parcel Received at Hub',
                    `Your parcel #${tn} has been received and checked in at ${parcel.currentHub?.name || 'the hub'}. It will be dispatched soon.`,
                    'success',
                    trackLink,
                );
            }
        }

        if (status === ParcelStatus.IN_TRANSIT) {
            // Traveler picked up parcel — notify sender
            if (parcel.sender) {
                await this.notificationsService.create(
                    parcel.sender.id,
                    '🚀 Parcel Picked Up & In Transit',
                    `Your parcel #${tn} has been picked up by a traveler and is now in transit to ${parcel.receiverAddress}.`,
                    'info',
                    trackLink,
                );
            }
            // Notify the assigned traveler that the hub has dispatched the parcel to them
            if (parcel.assignedTo) {
                await this.notificationsService.create(
                    parcel.assignedTo.id,
                    '🚚 Parcel Dispatched to You!',
                    `Hub ${parcel.currentHub?.name || 'Manager'} has dispatched parcel #${tn} to you. It is now in your active deliveries list.`,
                    'success',
                    '/traveler/deliveries',
                );
            }
            // Notify destination hub manager
            if (parcel.destinationHub) {
                const destManagers = await this.usersRepository.find({
                    where: { hubId: parcel.destinationHub.id, role: 'hub_manager' }
                });
                for (const mgr of destManagers) {
                    await this.notificationsService.create(
                        mgr.id,
                        '🚚 Parcel In Transit to Your Hub',
                        `Parcel #${tn} is on its way to your hub. Estimated arrival soon.`,
                        'info',
                        '/hub/inventory',
                    );
                }
            }
        }

        if (status === ParcelStatus.OUT_FOR_DELIVERY) {
            if (parcel.sender) {
                await this.notificationsService.create(
                    parcel.sender.id,
                    '🏃 Out for Delivery!',
                    `Your parcel #${tn} is out for final delivery to ${parcel.receiverName}. Expected today.`,
                    'success',
                    trackLink,
                );
            }
        }

        if (status === ParcelStatus.DELIVERED) {
            // Notify sender
            if (parcel.sender) {
                await this.notificationsService.create(
                    parcel.sender.id,
                    '🎉 Parcel Delivered!',
                    `Your parcel #${tn} has been successfully delivered to ${parcel.receiverName}. Thank you for using our service!`,
                    'success',
                    trackLink,
                );
            }
            // Notify destination hub manager
            if (parcel.destinationHub) {
                const managers = await this.usersRepository.find({
                    where: { role: 'hub_manager', hubId: parcel.destinationHub.id }
                });
                for (const manager of managers) {
                    await this.notificationsService.create(
                        manager.id,
                        '✅ Parcel Delivered',
                        `Parcel #${tn} has been delivered at its destination: ${parcel.destinationHub.name}.`,
                        'success',
                        '/hub/inventory',
                    );
                }
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

    async dispatchParcel(parcelId: string) {
        return this.updateStatus(parcelId, ParcelStatus.IN_TRANSIT);
    }

    async getTrackingLogs(id: string) {
        return this.trackingService.findByParcel(id);
    }

    async assignTraveler(parcelId: string, travelerId: string) {
        await this.parcelsRepository.update(parcelId, {
            assignedTo: { id: travelerId } as any,
        });
        const parcel = await this.parcelsRepository.findOne({
            where: { id: parcelId },
            relations: ['sender', 'currentHub', 'destinationHub', 'assignedTo'],
        });
        if (!parcel) throw new NotFoundException('Parcel not found');

        // Notify hub manager that a traveler has claimed this parcel
        if (parcel.currentHub) {
            const managers = await this.usersRepository.find({
                where: { hubId: parcel.currentHub.id, role: 'hub_manager' },
            });
            for (const mgr of managers) {
                await this.notificationsService.create(
                    mgr.id,
                    '🧳 Traveler Assigned to Parcel',
                    `Traveler ${parcel.assignedTo?.name || 'A traveler'} has claimed parcel #${parcel.trackingNumber}. Please dispatch it when ready.`,
                    'info',
                    '/hub/inventory',
                );
            }
        }
        return parcel;
    }

    async getByAssignedUser(userId: string) {
        return this.parcelsRepository.find({
            where: { assignedTo: { id: userId } },
            relations: ['sender', 'currentHub', 'destinationHub'],
        });
    }

    async getHubHistory(hubId: string) {
        return this.parcelsRepository.find({
            where: [
                // Parcels dispatched from this hub
                {
                    currentHub: { id: hubId },
                    status: In([
                        ParcelStatus.IN_TRANSIT,
                        ParcelStatus.OUT_FOR_DELIVERY,
                        ParcelStatus.DELIVERED,
                    ]),
                },
                // Parcels that reached their destination (this hub)
                {
                    destinationHub: { id: hubId },
                    status: ParcelStatus.DELIVERED,
                },
            ],
            relations: ['sender', 'currentHub', 'destinationHub', 'assignedTo'],
            order: { updatedAt: 'DESC' },
        });
    }
}
