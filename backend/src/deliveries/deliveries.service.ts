import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery, DeliveryStatus, DeliveryType } from './entities/delivery.entity';
import { ParcelsService } from '../parcels/parcels.service';
import { ParcelStatus } from '../common/enums/parcel-status.enum';

@Injectable()
export class DeliveriesService {
    constructor(
        @InjectRepository(Delivery)
        private deliveriesRepository: Repository<Delivery>,
        private parcelsService: ParcelsService,
    ) { }

    async create(deliveryData: Partial<Delivery>) {
        const delivery = this.deliveriesRepository.create(deliveryData);
        return this.deliveriesRepository.save(delivery);
    }

    findAll() {
        return this.deliveriesRepository.find({ relations: ['parcel', 'deliveryMan'] });
    }

    async updateStatus(id: string, status: DeliveryStatus, otp?: string) {
        const delivery = await this.deliveriesRepository.findOne({
            where: { id },
            relations: ['parcel']
        });
        if (!delivery) throw new NotFoundException('Delivery not found');

        if (status === DeliveryStatus.COMPLETED) {
            if (delivery.type === DeliveryType.FINAL_DELIVERY && delivery.otp !== otp) {
                throw new Error('Invalid OTP');
            }

            // Update parcel status based on delivery type
            let parcelStatus = ParcelStatus.IN_TRANSIT;
            if (delivery.type === DeliveryType.PICKUP) parcelStatus = ParcelStatus.PICKED_UP;
            if (delivery.type === DeliveryType.FINAL_DELIVERY) parcelStatus = ParcelStatus.DELIVERED;

            await this.parcelsService.updateStatus(delivery.parcel.id, parcelStatus);
        }

        await this.deliveriesRepository.update(id, { status });
        return this.deliveriesRepository.findOne({ where: { id } });
    }

    async acceptParcel(parcelId: string, travelerId: string) {
        // Update parcel status
        await this.parcelsService.updateStatus(parcelId, ParcelStatus.IN_TRANSIT);

        // Create a new delivery entry
        const delivery = this.deliveriesRepository.create({
            parcel: { id: parcelId } as any,
            deliveryMan: { id: travelerId } as any,
            type: DeliveryType.TRAVELER_DELIVERY,
            status: DeliveryStatus.IN_PROGRESS,
        });

        return this.deliveriesRepository.save(delivery);
    }

    findAvailable() {
        return this.deliveriesRepository.find({
            where: { status: DeliveryStatus.ASSIGNED },
            relations: ['parcel']
        });
    }

    findMine(userId: string) {
        return this.deliveriesRepository.find({
            where: { deliveryMan: { id: userId } },
            relations: ['parcel', 'parcel.sender', 'parcel.currentHub', 'parcel.destinationHub']
        });
    }
}
