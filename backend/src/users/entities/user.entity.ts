import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { TransportType } from '../../transport-modes/entities/transport-mode.entity';
import { Hub } from '../../hubs/entities/hub.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ select: false })
    password: string;

    @Column()
    name: string;

    @Column({ unique: true })
    phone: string;

    @Column({ default: 'customer' })
    role: string;

    @ManyToOne(() => Hub, { nullable: true })
    @JoinColumn({ name: 'hub_id' })
    hub: Hub;

    @Column({ name: 'hub_id', nullable: true })
    hubId: string;

    // Delivery Boy specific fields
    @Column({ nullable: true })
    vehicleType: string;

    @Column({ nullable: true })
    vehicleNumber: string;

    @Column({ nullable: true })
    licenseNumber: string;

    @Column({ default: false })
    isAvailable: boolean;

    @Column('float', { nullable: true })
    currentLat: number;

    @Column('float', { nullable: true })
    currentLng: number;

    @Column('int', { default: 5 })
    maxCapacity: number; // Maximum parcels they can carry

    @Column('int', { default: 0 })
    currentLoad: number; // Current number of parcels

    // Traveler matching coordinates
    @Column('float', { nullable: true })
    travelStartLat: number;

    @Column('float', { nullable: true })
    travelStartLng: number;

    @Column('float', { nullable: true })
    travelEndLat: number;

    @Column('float', { nullable: true })
    travelEndLng: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

