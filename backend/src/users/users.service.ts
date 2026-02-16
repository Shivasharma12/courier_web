import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { email },
            select: ['id', 'email', 'password', 'name', 'role', 'phone', 'hubId']
        });
    }

    async findById(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async create(userData: Partial<User>): Promise<User> {
        const existing = await this.findByEmail(userData.email!);
        if (existing) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(userData.password!, 10);
        const user = this.usersRepository.create({
            ...userData,
            password: hashedPassword,
        });

        return this.usersRepository.save(user);
    }

    async updateProfile(id: string, updates: Partial<User>): Promise<User | null> {
        // Prevent role matching from here
        delete (updates as any).role;
        delete (updates as any).password;

        await this.usersRepository.update(id, updates);
        return this.findById(id);
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async findByRole(role: string): Promise<User[]> {
        return this.usersRepository.find({ where: { role } });
    }

    async getUserStats() {
        const allUsers = await this.usersRepository.find();
        const stats = {
            total: allUsers.length,
            byRole: {
                admin: allUsers.filter(u => u.role === 'admin').length,
                customer: allUsers.filter(u => u.role === 'customer').length,
                delivery_partner: allUsers.filter(u => u.role === 'delivery_partner').length,
                hub_manager: allUsers.filter(u => u.role === 'hub_manager').length,
                traveler: allUsers.filter(u => u.role === 'traveler').length,
            },
            recentUsers: allUsers.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ).slice(0, 5)
        };
        return stats;
    }

    async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
        // Admin can update any field except password (use separate method)
        if (updates.password) {
            delete updates.password;
        }

        await this.usersRepository.update(id, updates);
        return this.findById(id);
    }

    async remove(id: string): Promise<void> {
        await this.usersRepository.delete(id);
    }
}
