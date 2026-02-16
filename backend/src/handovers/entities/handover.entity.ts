import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Parcel } from '../../parcels/entities/parcel.entity';
import { User } from '../../users/entities/user.entity';

export enum HandoverType {
    SENDER_TO_HUB = 'sender_to_hub',
    HUB_TO_TRAVELER = 'hub_to_traveler',
    TRAVELER_TO_HUB = 'traveler_to_hub',
    HUB_TO_RECEIVER = 'hub_to_receiver',
}

export enum HandoverStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

@Entity('handovers')
export class Handover {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Parcel)
    @JoinColumn({ name: 'parcel_id' })
    parcel: Parcel;

    @Column({ name: 'parcel_id' })
    parcelId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'from_user_id' })
    fromUser: User;

    @Column({ name: 'from_user_id', nullable: true })
    fromUserId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'to_user_id' })
    toUser: User;

    @Column({ name: 'to_user_id', nullable: true })
    toUserId: string;

    @Column({
        type: 'varchar',
        enum: HandoverType,
    })
    type: HandoverType;

    @Column({
        type: 'varchar',
        enum: HandoverStatus,
        default: HandoverStatus.PENDING,
    })
    status: HandoverStatus;

    @Column({ select: false, nullable: true })
    verificationCode: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
