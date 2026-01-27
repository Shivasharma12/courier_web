import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Parcel } from '../../parcels/entities/parcel.entity';
import { Hub } from '../../hubs/entities/hub.entity';
import { User } from '../../users/entities/user.entity';
import { TransportMode } from '../../transport-modes/entities/transport-mode.entity';

export enum RouteSegmentStatus {
    PENDING = 'pending',
    ASSIGNED = 'assigned',
    IN_TRANSIT = 'in_transit',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

@Entity('route_segments')
export class RouteSegment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Parcel)
    @JoinColumn({ name: 'parcel_id' })
    parcel: Parcel;

    @Column('int')
    segmentOrder: number; // 1, 2, 3... for sequential segments

    @ManyToOne(() => Hub)
    @JoinColumn({ name: 'from_hub_id' })
    fromHub: Hub;

    @ManyToOne(() => Hub)
    @JoinColumn({ name: 'to_hub_id' })
    toHub: Hub;

    @ManyToOne(() => TransportMode)
    @JoinColumn({ name: 'transport_mode_id' })
    transportMode: TransportMode;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'delivery_person_id' })
    deliveryPerson: User;

    @Column({ default: 'pending' })
    status: string;

    @Column('float')
    distance: number; // in km

    @Column('float')
    estimatedCost: number;

    @Column({ nullable: true })
    pickupOtp: string;

    @Column({ nullable: true })
    deliveryOtp: string;

    @Column({ nullable: true })
    pickupTime: Date;

    @Column({ nullable: true })
    deliveryTime: Date;

    @Column({ nullable: true })
    estimatedArrival: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
