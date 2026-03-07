import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly authService: AuthService,
    ) { }

    // Specific routes must come before generic routes
    @Post('create')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Create a new user (Admin only)' })
    async createUser(@Body() userData: CreateUserDto) {
        return this.usersService.create(userData);
    }

    @Get('stats')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Get user statistics (Admin only)' })
    getUserStats() {
        return this.usersService.getUserStats();
    }

    @Get('role/:role')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Get users by role (Admin only)' })
    findByRole(@Param('role') role: string) {
        return this.usersService.findByRole(role);
    }

    @Patch('profile')
    @ApiOperation({ summary: 'Update current user profile' })
    async updateProfile(@Request() req, @Body() updates: any) {
        return this.usersService.updateProfile(req.user.userId, updates);
    }

    @Post('enable-dual-role')
    @ApiOperation({ summary: 'Enable both customer and traveler roles for current user' })
    async enableDualRole(@Request() req) {
        try {
            const updatedUser = await this.usersService.enableDualRole(req.user.userId);
            const token = this.authService.generateToken(updatedUser);
            return { access_token: token, user: updatedUser };
        } catch (e) {
            throw new BadRequestException(e.message);
        }
    }

    @Post('switch-role')
    @ApiOperation({ summary: 'Switch active role between customer and traveler' })
    async switchRole(@Request() req, @Body('role') role: string) {
        if (!role) throw new BadRequestException('role is required');
        try {
            const updatedUser = await this.usersService.switchActiveRole(req.user.userId, role);
            const token = this.authService.generateToken(updatedUser);
            return { access_token: token, user: updatedUser };
        } catch (e) {
            throw new BadRequestException(e.message);
        }
    }

    @Patch('change-password')
    @ApiOperation({ summary: 'Change current user password' })
    async changePassword(@Request() req, @Body() data: any) {
        if (!data.oldPassword || !data.newPassword) {
            throw new BadRequestException('oldPassword and newPassword are required');
        }
        try {
            await this.usersService.changePassword(req.user.userId, data.oldPassword, data.newPassword);
            return { success: true, message: 'Password changed successfully' };
        } catch (e) {
            throw new BadRequestException(e.message);
        }
    }

    @Get()
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Get all users (Admin only)' })
    findAll() {
        return this.usersService.findAll();
    }

    @Patch(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Update user by ID (Admin only)' })
    updateUser(@Param('id') id: string, @Body() updates: UpdateUserDto) {
        return this.usersService.updateUser(id, updates);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Delete user (Admin only)' })
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
