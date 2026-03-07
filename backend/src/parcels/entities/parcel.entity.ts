import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Hub } from '../../hubs/entities/hub.entity';
import { ParcelStatus } from '../../common/enums/parcel-status.enum';
import { TransportType } from '../../transport-modes/entities/transport-mode.entity';

@Entity('parcels')
export class Parcel {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tracking_number', unique: true })
    trackingNumber: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'sender_id' })
    sender: User;

    @Column()
    senderName: string;

    @Column()
    senderPhone: string;

    @Column()
    senderAddress: string;

    @Column('float', { nullable: true })
    senderLat: number;

    @Column('float', { nullable: true })
    senderLng: number;

    @Column()
    receiverName: string;

    @Column()
    receiverPhone: string;

    @Column()
    receiverAddress: string;

    @Column('float')
    receiverLat: number;

    @Column('float')
    receiverLng: number;

    @Column('float')
    weight: number;

    @Column('float', { nullable: true })
    length: number; // in cm

    @Column('float', { nullable: true })
    width: number; // in cm

    @Column('float', { nullable: true })
    height: number; // in cm

    @Column('text', { nullable: true })
    description: string;

    @Column('text', { nullable: true })
    images: string; // JSON string of image URLs

    @Column({ nullable: true })
    preferredTransportMode: string;

    @Column('float')
    price: number;

    @Column({ default: ParcelStatus.WAITING_FOR_DROP })
    status: string;

    @Index()
    @ManyToOne(() => Hub, { nullable: true })
    @JoinColumn({ name: 'current_hub_id' })
    currentHub: Hub;

    @Index()
    @ManyToOne(() => Hub)
    @JoinColumn({ name: 'destination_hub_id' })
    destinationHub: Hub;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'assigned_to_id' })
    assignedTo: User;

    @Column({ nullable: true })
    estimatedDeliveryDate: Date;

    @Column({ nullable: true })
    dropDeadline: Date; // 48h after creation; parcel expires if not dropped

    @Column({ nullable: true })
    dispatchedAt: Date; // set when hub dispatches to traveler

    @Column({ nullable: true })
    actualDeliveryDate: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

