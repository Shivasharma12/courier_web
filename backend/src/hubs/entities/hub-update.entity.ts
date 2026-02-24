import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Hub } from './hub.entity';
import { User } from '../../users/entities/user.entity';

@Entity('hub_updates')
export class HubUpdate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Hub)
    @JoinColumn({ name: 'hub_id' })
    hub: Hub;

    @Column({ name: 'hub_id' })
    hubId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'manager_id' })
    manager: User;

    @Column({ name: 'manager_id' })
    managerId: string;

    @Column('jsonb')
    requestedData: {
        name?: string;
        description?: string;
        operatingHours?: string;
        capacity?: number;
    };

    @Column({ default: 'pending' }) // pending, approved, rejected
    status: string;

    @Column({ nullable: true })
    adminComment: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
