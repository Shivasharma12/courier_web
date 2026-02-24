import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (user && (await bcrypt.compare(pass, user.password))) {
            // Fetch full user (all columns including roles) after password check
            const fullUser = await this.usersService.findById(user.id);
            if (fullUser) {
                const { password, ...result } = fullUser as any;
                return result;
            }
        }
        return null;
    }

    async login(user: any) {
        console.log(`DEBUG: AuthService.login for user ${user.email}, roles:`, JSON.stringify(user.roles));
        return {
            access_token: this.generateToken(user),
            user,
        };
    }

    generateToken(user: any): string {
        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role,
            roles: user.roles || [user.role],
            hubId: user.hubId,
        };
        console.log(`DEBUG: Generated token payload for ${user.email}:`, JSON.stringify(payload));
        return this.jwtService.sign(payload);
    }

    async register(userData: any) {
        // Check if user already exists
        const existingUser = await this.usersService.findByEmail(userData.email);
        if (existingUser) {
            throw new BadRequestException('Email already registered');
        }

        try {
            const user = await this.usersService.create(userData);
            const { password, ...result } = user;
            return result;
        } catch (error) {
            // Handle duplicate email constraint violation
            if (error.code === '23505') {
                throw new BadRequestException('Email already registered');
            }
            throw error;
        }
    }
}
