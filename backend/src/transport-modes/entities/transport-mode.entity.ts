import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TransportType {
    BIKE = 'bike',
    VAN = 'van',
    TRUCK = 'truck',
    AIR = 'air',
    TRAIN = 'train',
}

@Entity('transport_modes')
export class TransportMode {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    type: string;

    @Column()
    name: string;

    @Column('text')
    description: string;

    @Column('float')
    maxWeight: number; // in kg

    @Column('float')
    maxVolume: number; // in cubic meters

    @Column('int')
    avgSpeed: number; // km/h

    @Column('float')
    costPerKm: number; // base cost per km

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
