import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Parcel } from '../../parcels/entities/parcel.entity';
import { User } from '../../users/entities/user.entity';

export enum DeliveryType {
    PICKUP = 'pickup',
    HUB_TRANSFER = 'hub_transfer',
    FINAL_DELIVERY = 'final_delivery',
    TRAVELER_DELIVERY = 'traveler_delivery',
}

export enum DeliveryStatus {
    ASSIGNED = 'assigned',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

@Entity('deliveries')
export class Delivery {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Parcel)
    @JoinColumn({ name: 'parcel_id' })
    parcel: Parcel;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'delivery_man_id' })
    deliveryMan: User;

    @Column()
    type: string;

    @Column({ default: 'assigned' })
    status: string;

    @Column({ nullable: true })
    otp: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
