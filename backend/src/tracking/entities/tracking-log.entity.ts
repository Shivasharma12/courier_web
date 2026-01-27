import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Parcel } from '../../parcels/entities/parcel.entity';

@Entity('tracking_logs')
export class TrackingLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Parcel)
    @JoinColumn({ name: 'parcel_id' })
    parcel: Parcel;

    @Column()
    status: string;

    @Column()
    description: string;

    @Column('float', { nullable: true })
    lat: number;

    @Column('float', { nullable: true })
    lng: number;

    @CreateDateColumn()
    timestamp: Date;
}
