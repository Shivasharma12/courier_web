import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Handover, HandoverType, HandoverStatus } from './entities/handover.entity';
import { Parcel } from '../parcels/entities/parcel.entity';
import { ParcelStatus } from '../common/enums/parcel-status.enum';
import * as QRCode from 'qrcode';

@Injectable()
export class HandoversService {
    constructor(
        @InjectRepository(Handover)
        private handoverRepository: Repository<Handover>,
        @InjectRepository(Parcel)
        private parcelRepository: Repository<Parcel>,
    ) { }

    async createHandover(parcelId: string, fromUserId: string, toUserId: string, type: HandoverType) {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const handover = this.handoverRepository.create({
            parcelId,
            fromUserId,
            toUserId,
            type,
            verificationCode,
            status: HandoverStatus.PENDING,
        });

        return this.handoverRepository.save(handover);
    }

    async getHandoverQR(handoverId: string) {
        const handover = await this.handoverRepository.findOne({
            where: { id: handoverId },
            select: ['id', 'verificationCode']
        });

        if (!handover) throw new NotFoundException('Handover not found');

        const qrData = JSON.stringify({
            handoverId: handover.id,
            code: handover.verificationCode
        });

        return QRCode.toDataURL(qrData);
    }

    async verifyHandover(handoverId: string, verificationCode: string) {
        const handover = await this.handoverRepository.findOne({
            where: { id: handoverId },
            relations: ['parcel']
        });

        if (!handover) throw new NotFoundException('Handover not found');
        if (handover.status !== HandoverStatus.PENDING) {
            throw new BadRequestException('Handover is already processed');
        }

        // In a real app, we'd compare codes. For simplicity and since we have the full handover object:
        // Verification code check is usually done via a select: false field, so we need to fetch it explicitly if not already.
        const fullHandover = await this.handoverRepository.createQueryBuilder('handover')
            .addSelect('handover.verificationCode')
            .where('handover.id = :id', { id: handoverId })
            .getOne();

        if (!fullHandover || fullHandover.verificationCode !== verificationCode) {
            throw new BadRequestException('Invalid verification code');
        }

        // Update Handover
        handover.status = HandoverStatus.COMPLETED;
        await this.handoverRepository.save(handover);

        // Update Parcel Status based on handover type
        const parcel = handover.parcel;
        switch (handover.type) {
            case HandoverType.SENDER_TO_HUB:
                parcel.status = ParcelStatus.AT_HUB;
                break;
            case HandoverType.HUB_TO_TRAVELER:
                parcel.status = ParcelStatus.IN_TRANSIT;
                break;
            case HandoverType.TRAVELER_TO_HUB:
                parcel.status = ParcelStatus.AT_HUB;
                break;
            case HandoverType.HUB_TO_RECEIVER:
                parcel.status = ParcelStatus.DELIVERED;
                break;
        }

        await this.parcelRepository.save(parcel);
        return { message: 'Handover verified and parcel status updated', parcelStatus: parcel.status };
    }

    async findByParcel(parcelId: string) {
        return this.handoverRepository.find({
            where: { parcelId },
            order: { createdAt: 'DESC' }
        });
    }
}
