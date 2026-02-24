import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string; // The recipient

    @Column()
    title: string;

    @Column('text')
    message: string;

    @Column({ default: 'info' }) // 'info' | 'success' | 'warning' | 'error'
    type: string;

    @Column({ default: false })
    isRead: boolean;

    @Column({ nullable: true })
    link: string; // Optional deep-link (e.g. /hub/profile)

    @CreateDateColumn()
    createdAt: Date;
}
