import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Hub } from '../../hubs/entities/hub.entity';
import { TravelPlanStatus } from '../../common/enums/travel-plan-status.enum';

@Entity('travel_plans')
export class TravelPlan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ nullable: true })
    fromLocation: string;

    @Column('float', { nullable: true })
    fromLat: number;

    @Column('float', { nullable: true })
    fromLng: number;

    @Column({ nullable: true })
    toLocation: string;

    @Column('float', { nullable: true })
    toLat: number;

    @Column('float', { nullable: true })
    toLng: number;

    @ManyToOne(() => Hub, { nullable: true })
    @JoinColumn({ name: 'start_hub_id' })
    startHub: Hub;

    @ManyToOne(() => Hub, { nullable: true })
    @JoinColumn({ name: 'end_hub_id' })
    endHub: Hub;

    @Column()
    travelDate: Date;

    @Column()
    mode: string; // bike, van, car, plane, etc.

    @Column('int', { default: 5 })
    capacity: number;

    @Column({ default: TravelPlanStatus.ACTIVE_TRAVEL })
    status: string; // active, completed, cancelled

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
