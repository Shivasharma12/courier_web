import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Parcel } from './parcel.entity';
import { Hub } from '../../hubs/entities/hub.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Tracks each hub-to-hub leg of a parcel's journey.
 * A new leg is created each time a hub manager dispatches the parcel.
 * The leg is closed (receivedAt set) when the next hub receives it.
 */
@Entity('parcel_legs')
export class ParcelLeg {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Parcel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parcel_id' })
    parcel: Parcel;

    @Column({ name: 'from_hub_id', nullable: true })
    fromHubId: string;

    @ManyToOne(() => Hub, { nullable: true })
    @JoinColumn({ name: 'from_hub_id' })
    fromHub: Hub;

    @Column({ name: 'to_hub_id', nullable: true })
    toHubId: string;

    @ManyToOne(() => Hub, { nullable: true })
    @JoinColumn({ name: 'to_hub_id' })
    toHub: Hub;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'traveler_id' })
    traveler: User;

    @Column({ nullable: true })
    dispatchedAt: Date;

    @Column({ nullable: true })
    receivedAt: Date;

    /** in_progress | completed */
    @Column({ default: 'in_progress' })
    status: string;

    @CreateDateColumn()
    createdAt: Date;
}
