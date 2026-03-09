import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
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

    // For authentication: fetches password + basic profile only
    async findByEmail(email: string): Promise<User | null> {
        const user = await this.usersRepository.findOne({
            where: { email },
            select: ['id', 'email', 'password', 'name', 'role', 'roles', 'phone', 'hubId', 'createdAt'],
        });
        if (!user) return null;
        return this.normalizeUserRoles(user);
    }

    // For full profile (all columns including roles array)
    async findByEmailFull(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findById(id: string): Promise<User | null> {
        const user = await this.usersRepository.findOne({
            where: { id },
            relations: ['hub'],
            select: ['id', 'email', 'name', 'role', 'roles', 'phone', 'hubId', 'createdAt'],
        });
        if (!user) throw new NotFoundException(`User with ID ${id} not found`);
        return this.normalizeUserRoles(user);
    }

    async findByHubId(hubId: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { hubId } });
    }

    async findAdmins(): Promise<User[]> {
        return this.usersRepository.find({ where: { role: 'admin' } });
    }

    async create(userData: Partial<User>): Promise<User> {
        const existing = await this.findByEmail(userData.email!);
        if (existing) {
            throw new ConflictException('Email already exists');
        }

        const existingPhone = await this.usersRepository.findOne({ where: { phone: userData.phone } });
        if (existingPhone) {
            throw new ConflictException('Phone number already registered');
        }

        if (!userData.password) throw new BadRequestException('Password is required');
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Always ensure roles array is set and includes the primary role
        const primaryRole = userData.role || 'customer';
        const rolesArray: string[] = userData.roles?.length
            ? (Array.isArray(userData.roles) ? userData.roles : [userData.roles])
            : [primaryRole];
        // Make sure the primary role is always in the array
        if (!rolesArray.includes(primaryRole)) {
            rolesArray.unshift(primaryRole);
        }

        const user = this.usersRepository.create({
            ...userData,
            password: hashedPassword,
            roles: rolesArray,
        });

        return this.normalizeUserRoles(await this.usersRepository.save(user));
    }

    async updateProfile(id: string, updates: Partial<User>): Promise<User | null> {
        // If email is being updated, check for collision
        if (updates.email) {
            const existing = await this.findByEmail(updates.email);
            if (existing && existing.id !== id) {
                throw new ConflictException('Email already exists');
            }
        }

        // Prevent password and role updates from here
        delete (updates as any).role;
        delete (updates as any).password;
        delete (updates as any).oldPassword;
        delete (updates as any).newPassword;
        delete (updates as any).confirmPassword;

        await this.usersRepository.update(id, updates);
        return this.findById(id);
    }

    async findAll(): Promise<User[]> {
        const users = await this.usersRepository.find({
            relations: ['hub']
        });

        return users.map(u => this.normalizeUserRoles(u));
    }

    async findByRole(role: string): Promise<User[]> {
        const users = await this.usersRepository.find({
            where: { role },
            relations: ['hub']
        });
        return users.map(u => this.normalizeUserRoles(u));
    }

    async getUserStats() {
        const allUsers = await this.usersRepository.find();
        const stats = {
            total: allUsers.length,
            byRole: {
                admin: allUsers.filter(u => u.role === 'admin').length,
                customer: allUsers.filter(u => u.role === 'customer').length,
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
        // If email is being updated, check for collision
        if (updates.email) {
            const existing = await this.findByEmail(updates.email);
            if (existing && existing.id !== id) {
                throw new ConflictException('Email already exists');
            }
        }

        // Admin can update any field except password (use separate method)
        if (updates.password) delete updates.password;
        if ((updates as any).oldPassword) delete (updates as any).oldPassword;
        if ((updates as any).newPassword) delete (updates as any).newPassword;
        if ((updates as any).confirmPassword) delete (updates as any).confirmPassword;

        // Ensure roles array is consistent with primary role
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');

        const primaryRole = updates.role || user.role;
        let rolesArray = updates.roles || user.roles;

        if (typeof rolesArray === 'string') {
            try { rolesArray = JSON.parse(rolesArray); } catch (e) { rolesArray = []; }
        }

        rolesArray = Array.isArray(rolesArray) ? rolesArray : [primaryRole];

        // Make sure the primary role is always in the array
        if (!rolesArray.includes(primaryRole)) {
            rolesArray.push(primaryRole);
        }

        // If updates.roles was provided but primaryRole was NOT, 
        // and current primaryRole is NOT in the new roles array,
        // we should pick the first one from the new roles array as primary
        if (updates.roles && !updates.role && !rolesArray.includes(user.role)) {
            updates.role = rolesArray[0];
        }

        await this.usersRepository.update(id, { ...updates, roles: rolesArray });
        return this.findById(id);
    }

    async remove(id: string): Promise<void> {
        await this.usersRepository.delete(id);
    }

    async enableDualRole(userId: string): Promise<User> {
        const user = await this.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        // Only customer <-> traveler switch is supported
        const eligible = ['customer', 'traveler'];
        if (!eligible.includes(user.role)) {
            throw new BadRequestException('Dual role only supported for customer and traveler accounts');
        }

        const otherRole = user.role === 'customer' ? 'traveler' : 'customer';
        const currentRoles: string[] = Array.isArray(user.roles) ? user.roles : [user.role];

        if (!currentRoles.includes(otherRole)) {
            currentRoles.push(otherRole);
        }

        await this.usersRepository.update(userId, { roles: Array.from(new Set(currentRoles)) });
        return this.findById(userId) as Promise<User>;
    }

    async switchActiveRole(userId: string, targetRole: string): Promise<User> {
        const user = await this.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // findById already normalizes roles to an array
        const currentRoles: string[] = Array.isArray(user.roles) ? user.roles : [user.role];

        // Normalize comparison
        const target = String(targetRole || '').toLowerCase();
        const hasRole = currentRoles.some(r => String(r).toLowerCase() === target);

        if (!hasRole) {
            throw new BadRequestException(`Role '${targetRole}' not enabled for this user. Available: ${currentRoles.join(', ')}`);
        }

        await this.usersRepository.update(userId, { role: target });

        return this.findById(userId) as Promise<User>;
    }

    async changePassword(userId: string, oldPass: string, newPass: string): Promise<void> {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            select: ['id', 'password'],
        });
        if (!user) throw new NotFoundException('User not found');

        const isMatch = await bcrypt.compare(oldPass, user.password);
        if (!isMatch) throw new BadRequestException('Current password does not match');

        const hashed = await bcrypt.hash(newPass, 10);
        await this.usersRepository.update(userId, { password: hashed });
    }

    private normalizeUserRoles(user: User): User {
        if (!user) return user;
        let rolesArray = user.roles;
        if (typeof rolesArray === 'string') {
            try {
                rolesArray = JSON.parse(rolesArray);
            } catch (e) {
                rolesArray = [];
            }
        }

        const finalRoles = Array.isArray(rolesArray)
            ? rolesArray.map(r => String(r)).filter(Boolean)
            : [];

        if (finalRoles.length === 0 && user.role) {
            finalRoles.push(user.role);
        }

        return {
            ...user,
            roles: Array.from(new Set(finalRoles)),
        } as User;
    }
}
