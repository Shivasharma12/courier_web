import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { Parcel } from './entities/parcel.entity';
import { ParcelLeg } from './entities/parcel-leg.entity';
import { ParcelStatus } from '../common/enums/parcel-status.enum';
import { User } from '../users/entities/user.entity';
import { TravelMatchingService } from '../travel-plans/travel-matching.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TrackingService } from '../tracking/tracking.service';

@Injectable()
export class ParcelsService {
    constructor(
        @InjectRepository(Parcel)
        private parcelsRepository: Repository<Parcel>,
        @InjectRepository(ParcelLeg)
        private legRepository: Repository<ParcelLeg>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private travelMatchingService: TravelMatchingService,
        private notificationsService: NotificationsService,
        private trackingService: TrackingService,
    ) { }

    // ──────────────────────────────────────────────────────────────────
    // CREATE
    // ──────────────────────────────────────────────────────────────────
    async create(parcelData: any, senderId: string) {
        const sender = await this.usersRepository.findOne({ where: { id: senderId } });
        if (!sender) throw new NotFoundException('Sender not found');

        const trackingNumber = 'TRK' + Date.now().toString().slice(-10);
        const price = (parcelData.weight || 1) * 10;

        const { destinationHubId, currentHubId, ...rest } = parcelData;

        // 48-hour drop-off deadline from now
        const dropDeadline = new Date();
        dropDeadline.setHours(dropDeadline.getHours() + 48);

        const parcel = this.parcelsRepository.create({
            ...rest,
            sender: { id: senderId } as any,
            senderName: sender.name,
            senderPhone: sender.phone,
            trackingNumber,
            price,
            dropDeadline,
            // Always start as waiting_for_drop; hub manager must accept physical drop
            status: ParcelStatus.WAITING_FOR_DROP,
            destinationHub: destinationHubId ? { id: destinationHubId } as any : null,
            currentHub: currentHubId ? { id: currentHubId } as any : null,
        });

        const savedParcel: any = await this.parcelsRepository.save(parcel);

        await this.trackingService.createLog(
            savedParcel,
            ParcelStatus.WAITING_FOR_DROP,
            'Parcel request created. Please drop the parcel at the selected hub within 48 hours.',
        );

        // Notify the pickup hub manager of the new request
        if (currentHubId) {
            const hubManagers = await this.usersRepository.find({
                where: { hubId: currentHubId, role: 'hub_manager' },
            });
            for (const mgr of hubManagers) {
                await this.notificationsService.create(
                    mgr.id,
                    '📦 New Parcel Drop-off Request',
                    `Customer ${sender.name} will drop parcel #${trackingNumber} at your hub. Accept it once physically received.`,
                    'info',
                    '/hub/inventory',
                );
            }
        }

        // Notify destination hub manager
        if (destinationHubId && destinationHubId !== currentHubId) {
            const destManagers = await this.usersRepository.find({
                where: { hubId: destinationHubId, role: 'hub_manager' },
            });
            for (const mgr of destManagers) {
                await this.notificationsService.create(
                    mgr.id,
                    '📦 Parcel En Route to Your Hub',
                    `Parcel #${trackingNumber} is heading to your hub once dispatched.`,
                    'info',
                    '/hub/inventory',
                );
            }
        }

        return savedParcel;
    }

    // ──────────────────────────────────────────────────────────────────
    // HUB MANAGER ACTIONS
    // ──────────────────────────────────────────────────────────────────

    /** Customer physically dropped parcel → hub manager accepts it */
    async acceptDropOff(parcelId: string, hubId: string) {
        const parcel = await this.parcelsRepository.findOne({
            where: { id: parcelId },
            relations: ['sender', 'currentHub', 'destinationHub'],
        });
        if (!parcel) throw new NotFoundException('Parcel not found');
        if (parcel.status !== ParcelStatus.WAITING_FOR_DROP) {
            throw new BadRequestException(`Parcel is not in waiting_for_drop state (current: ${parcel.status})`);
        }

        await this.parcelsRepository.update(parcelId, {
            status: ParcelStatus.AT_HUB,
            currentHubId: hubId,
        });

        await this.trackingService.createLog(
            { ...parcel, status: ParcelStatus.AT_HUB } as any,
            ParcelStatus.AT_HUB,
            `Parcel physically received and checked into hub inventory.`,
        );

        if (parcel.sender) {
            await this.notificationsService.create(
                parcel.sender.id,
                '✅ Parcel Received at Hub',
                `Your parcel #${parcel.trackingNumber} has been accepted at the hub. It will be dispatched soon.`,
                'success',
                `/customer/track?tracking=${parcel.trackingNumber}`,
            );
        }

        return this.parcelsRepository.findOne({
            where: { id: parcelId },
            relations: ['sender', 'currentHub', 'destinationHub', 'assignedTo'],
        });
    }

    /** Hub manager receives a parcel arriving from a traveler (in_transit → at_hub) */
    async receiveIncoming(parcelId: string, hubId: string) {
        const parcel = await this.parcelsRepository.findOne({
            where: { id: parcelId },
            relations: ['sender', 'currentHub', 'destinationHub', 'assignedTo'],
        });
        if (!parcel) throw new NotFoundException('Parcel not found');
        if (parcel.status !== ParcelStatus.IN_TRANSIT) {
            throw new BadRequestException(`Parcel is not in_transit (current: ${parcel.status})`);
        }

        // Close the open leg
        const openLeg = await this.legRepository.findOne({
            where: { parcel: { id: parcelId }, status: 'in_progress' },
            order: { createdAt: 'DESC' },
        });
        if (openLeg) {
            await this.legRepository.update(openLeg.id, {
                receivedAt: new Date(),
                status: 'completed',
                toHubId: hubId as any,
            });
        }

        await this.parcelsRepository.update(parcelId, {
            status: ParcelStatus.AT_HUB,
            currentHubId: hubId,
            assignedToId: undefined, // TypeORM treats undefined as 'no change', but we want to clear it.
        } as any);

        await this.trackingService.createLog(
            { ...parcel, status: ParcelStatus.AT_HUB } as any,
            ParcelStatus.AT_HUB,
            `Parcel received at intermediate hub from traveler ${parcel.assignedTo?.name || ''}.`,
        );

        if (parcel.sender) {
            await this.notificationsService.create(
                parcel.sender.id,
                '🏠 Parcel Arrived at Hub',
                `Your parcel #${parcel.trackingNumber} has arrived at an intermediate hub and is being processed.`,
                'info',
                `/customer/track?tracking=${parcel.trackingNumber}`,
            );
        }

        return this.parcelsRepository.findOne({
            where: { id: parcelId },
            relations: ['sender', 'currentHub', 'destinationHub', 'assignedTo'],
        });
    }

    /** Hub manager dispatches a parcel to the assigned traveler (at_hub → in_transit) */
    async dispatchParcel(parcelId: string) {
        const parcel = await this.parcelsRepository.findOne({
            where: { id: parcelId },
            relations: ['sender', 'currentHub', 'destinationHub', 'assignedTo'],
        });
        if (!parcel) throw new NotFoundException('Parcel not found');
        if (parcel.status !== ParcelStatus.AT_HUB) {
            throw new BadRequestException(`Parcel must be at_hub to dispatch (current: ${parcel.status})`);
        }
        if (!parcel.assignedTo) {
            throw new BadRequestException('No traveler assigned to this parcel. A traveler must claim it first.');
        }

        const now = new Date();
        await this.parcelsRepository.update(parcelId, {
            status: ParcelStatus.IN_TRANSIT,
            dispatchedAt: now,
        });

        // Create a new parcel leg
        await this.legRepository.save(
            this.legRepository.create({
                parcel: { id: parcelId } as any,
                fromHub: parcel.currentHub ? { id: parcel.currentHub.id } as any : null,
                toHub: parcel.destinationHub ? { id: parcel.destinationHub.id } as any : null,
                traveler: { id: parcel.assignedTo.id } as any,
                dispatchedAt: now,
                status: 'in_progress',
            }),
        );

        await this.trackingService.createLog(
            { ...parcel, status: ParcelStatus.IN_TRANSIT } as any,
            ParcelStatus.IN_TRANSIT,
            `Dispatched to traveler ${parcel.assignedTo.name}. Now in transit.`,
        );

        const tn = parcel.trackingNumber;
        const trackLink = `/customer/track?tracking=${tn}`;

        // Notify traveler
        await this.notificationsService.create(
            parcel.assignedTo.id,
            '🚚 Parcel Dispatched to You!',
            `Hub ${parcel.currentHub?.name || 'Manager'} dispatched parcel #${tn} to you. Carry it safely.`,
            'success',
            '/traveler/deliveries',
        );

        // Notify sender
        if (parcel.sender) {
            await this.notificationsService.create(
                parcel.sender.id,
                '🚀 Parcel Dispatched & In Transit',
                `Your parcel #${tn} has been dispatched to traveler ${parcel.assignedTo.name}.`,
                'info',
                trackLink,
            );
        }

        // Notify destination hub
        if (parcel.destinationHub) {
            const destManagers = await this.usersRepository.find({
                where: { hubId: parcel.destinationHub.id, role: 'hub_manager' },
            });
            for (const mgr of destManagers) {
                await this.notificationsService.create(
                    mgr.id,
                    '🚚 Parcel En Route to Your Hub',
                    `Parcel #${tn} is on its way to your hub via traveler ${parcel.assignedTo.name}.`,
                    'info',
                    '/hub/inventory',
                );
            }
        }

        return this.parcelsRepository.findOne({
            where: { id: parcelId },
            relations: ['sender', 'currentHub', 'destinationHub', 'assignedTo'],
        });
    }

    /** Hub manager confirms final delivery at the destination hub */
    async completeDelivery(parcelId: string) {
        const parcel = await this.parcelsRepository.findOne({
            where: { id: parcelId },
            relations: ['sender', 'currentHub', 'destinationHub', 'assignedTo'],
        });
        if (!parcel) throw new NotFoundException('Parcel not found');

        const now = new Date();
        await this.parcelsRepository.update(parcelId, {
            status: ParcelStatus.DELIVERED,
            actualDeliveryDate: now,
        });

        // Close any open leg
        const openLeg = await this.legRepository.findOne({
            where: { parcel: { id: parcelId }, status: 'in_progress' },
            order: { createdAt: 'DESC' },
        });
        if (openLeg) {
            await this.legRepository.update(openLeg.id, {
                receivedAt: now,
                status: 'completed',
            });
        }

        await this.trackingService.createLog(
            { ...parcel, status: ParcelStatus.DELIVERED } as any,
            ParcelStatus.DELIVERED,
            `Parcel delivered to ${parcel.receiverName} at ${parcel.destinationHub?.name || 'destination hub'}.`,
        );

        if (parcel.sender) {
            await this.notificationsService.create(
                parcel.sender.id,
                '🎉 Parcel Delivered!',
                `Your parcel #${parcel.trackingNumber} was delivered to ${parcel.receiverName}. Thank you!`,
                'success',
                `/customer/track?tracking=${parcel.trackingNumber}`,
            );
        }

        return this.parcelsRepository.findOne({
            where: { id: parcelId },
            relations: ['sender', 'currentHub', 'destinationHub'],
        });
    }

    // ──────────────────────────────────────────────────────────────────
    // AUTO-EXPIRY
    // ──────────────────────────────────────────────────────────────────
    async expirePendingParcels(): Promise<number> {
        const now = new Date();
        const expired = await this.parcelsRepository.find({
            where: {
                status: ParcelStatus.WAITING_FOR_DROP,
                dropDeadline: LessThan(now),
            },
            relations: ['sender', 'currentHub'],
        });

        for (const parcel of expired) {
            await this.parcelsRepository.update(parcel.id, { status: ParcelStatus.EXPIRED });
            await this.trackingService.createLog(
                { ...parcel, status: ParcelStatus.EXPIRED } as any,
                ParcelStatus.EXPIRED,
                'Parcel request expired — drop-off deadline passed without physical deposit.',
            );
            if (parcel.sender) {
                await this.notificationsService.create(
                    parcel.sender.id,
                    '⚠️ Parcel Request Expired',
                    `Parcel #${parcel.trackingNumber} request expired. Please create a new request if you still want to ship it.`,
                    'warning',
                    '/customer/history',
                );
            }
            if (parcel.currentHub) {
                const managers = await this.usersRepository.find({
                    where: { hubId: parcel.currentHub.id, role: 'hub_manager' },
                });
                for (const mgr of managers) {
                    await this.notificationsService.create(
                        mgr.id,
                        '⚠️ Parcel Request Expired',
                        `Parcel #${parcel.trackingNumber} was never dropped — it has been marked as expired.`,
                        'warning',
                        '/hub/inventory',
                    );
                }
            }
        }

        return expired.length;
    }

    // ──────────────────────────────────────────────────────────────────
    // QUERIES
    // ──────────────────────────────────────────────────────────────────

    findAll() {
        return this.parcelsRepository.find({
            relations: ['sender', 'currentHub', 'destinationHub', 'assignedTo'],
            order: { createdAt: 'DESC' },
        });
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

    /** Parcels physically at this hub (inventory) */
    findByHub(hubId: string) {
        return this.parcelsRepository.find({
            where: { currentHub: { id: hubId }, status: ParcelStatus.AT_HUB },
            relations: ['sender', 'destinationHub', 'assignedTo'],
            order: { createdAt: 'DESC' },
        });
    }

    /** Customer requests awaiting physical drop-off at this hub */
    findPendingRequests(hubId: string) {
        return this.parcelsRepository.find({
            where: { currentHub: { id: hubId }, status: ParcelStatus.WAITING_FOR_DROP },
            relations: ['sender', 'destinationHub'],
            order: { createdAt: 'DESC' },
        });
    }

    /** At-hub parcels that have an assigned traveler → ready to dispatch */
    findReadyForDispatch(hubId: string) {
        return this.parcelsRepository
            .createQueryBuilder('parcel')
            .leftJoinAndSelect('parcel.sender', 'sender')
            .leftJoinAndSelect('parcel.destinationHub', 'destinationHub')
            .leftJoinAndSelect('parcel.assignedTo', 'assignedTo')
            .where('parcel.current_hub_id = :hubId', { hubId })
            .andWhere('parcel.status = :status', { status: ParcelStatus.AT_HUB })
            .andWhere('parcel.assigned_to_id IS NOT NULL')
            .orderBy('parcel.updatedAt', 'DESC')
            .getMany();
    }

    /** In-transit parcels heading to this hub (from other hubs via travelers) */
    findIncomingForHub(hubId: string) {
        return this.parcelsRepository
            .createQueryBuilder('parcel')
            .leftJoinAndSelect('parcel.sender', 'sender')
            .leftJoinAndSelect('parcel.currentHub', 'currentHub')
            .leftJoinAndSelect('parcel.assignedTo', 'assignedTo')
            .where('parcel.destination_hub_id = :hubId', { hubId })
            .andWhere('parcel.status = :status', { status: ParcelStatus.IN_TRANSIT })
            .andWhere('(parcel.current_hub_id != :hubId OR parcel.current_hub_id IS NULL)', { hubId })
            .orderBy('parcel.updatedAt', 'DESC')
            .getMany();
    }

    /** All parcels related to this hub (active + history) */
    findAllForHub(hubId: string) {
        return this.parcelsRepository
            .createQueryBuilder('parcel')
            .leftJoinAndSelect('parcel.sender', 'sender')
            .leftJoinAndSelect('parcel.currentHub', 'currentHub')
            .leftJoinAndSelect('parcel.destinationHub', 'destinationHub')
            .leftJoinAndSelect('parcel.assignedTo', 'assignedTo')
            .where('parcel.current_hub_id = :hubId OR parcel.destination_hub_id = :hubId', { hubId })
            .orderBy('parcel.updatedAt', 'DESC')
            .getMany();
    }

    async getHubHistory(hubId: string) {
        return this.parcelsRepository.find({
            where: [
                { currentHub: { id: hubId }, status: In([ParcelStatus.IN_TRANSIT, ParcelStatus.OUT_FOR_DELIVERY, ParcelStatus.DELIVERED]) },
                { destinationHub: { id: hubId }, status: ParcelStatus.DELIVERED },
                { currentHub: { id: hubId }, status: ParcelStatus.EXPIRED },
            ],
            relations: ['sender', 'currentHub', 'destinationHub', 'assignedTo'],
            order: { updatedAt: 'DESC' },
        });
    }

    /** Full admin traceability — parcel + legs + logs */
    async getAdminTrace(parcelId: string) {
        const parcel = await this.parcelsRepository.findOne({
            where: { id: parcelId },
            relations: ['sender', 'currentHub', 'destinationHub', 'assignedTo'],
        });
        if (!parcel) throw new NotFoundException('Parcel not found');

        const legs = await this.legRepository.find({
            where: { parcel: { id: parcelId } },
            relations: ['fromHub', 'toHub', 'traveler'],
            order: { createdAt: 'ASC' },
        });

        const logs = await this.trackingService.findByParcel(parcelId);

        return { parcel, legs, logs };
    }

    async updateStatus(id: string, status: ParcelStatus) {
        await this.parcelsRepository.update(id, { status });
        const parcel = await this.parcelsRepository.findOne({
            where: { id },
            relations: ['sender', 'destinationHub', 'currentHub', 'assignedTo'],
        });
        if (!parcel) return null;

        let description = `Parcel status updated to ${status.replace(/_/g, ' ')}.`;
        await this.trackingService.createLog(parcel, status, description);
        return parcel;
    }

    async confirmHubDropoff(parcelId: string, hubId: string) {
        return this.acceptDropOff(parcelId, hubId);
    }

    async confirmHubPickup(parcelId: string) {
        return this.updateStatus(parcelId, ParcelStatus.IN_TRANSIT);
    }

    async assignTraveler(parcelId: string, travelerId: string) {
        await this.parcelsRepository.update(parcelId, {
            assignedToId: travelerId,
        });
        const parcel = await this.parcelsRepository.findOne({
            where: { id: parcelId },
            relations: ['sender', 'currentHub', 'destinationHub', 'assignedTo'],
        });
        if (!parcel) throw new NotFoundException('Parcel not found');

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
            order: { updatedAt: 'DESC' },
        });
    }

    async getTrackingLogs(id: string) {
        return this.trackingService.findByParcel(id);
    }
}
