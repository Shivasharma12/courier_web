import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TransportType } from '../../transport-modes/entities/transport-mode.entity';

@Entity('hubs')
export class Hub {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    address: string;

    @Column('float', { nullable: true })
    lat: number;

    @Column('float', { nullable: true })
    lng: number;

    @Column('int', { default: 1000 })
    capacity: number; // Maximum parcels

    @Column('int', { default: 0 })
    currentLoad: number; // Current parcel count

    @Column('text', { nullable: true })
    supportedTransportModes: string; // JSON string of transport types

    @Column({ nullable: true })
    operatingHours: string; // e.g., "24/7" or "9AM-6PM"

    @Column('text', { nullable: true })
    description: string;

    @Column('float', { default: 0 })
    totalEarnings: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

