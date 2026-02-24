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

    @Column({ type: 'jsonb', nullable: true })
    roles: string[];

    @ManyToOne(() => Hub, { nullable: true })
    @JoinColumn({ name: 'hub_id' })
    hub: Hub;

    @Column({ name: 'hub_id', nullable: true })
    hubId: string;

    // Traveler matching coordinates
    @Column('float', { nullable: true })
    travelStartLat: number;

    @Column('float', { nullable: true })
    travelStartLng: number;

    @Column('float', { nullable: true })
    travelEndLat: number;

    @Column('float', { nullable: true })
    travelEndLng: number;

    @Column({ nullable: true })
    vehicleType: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

