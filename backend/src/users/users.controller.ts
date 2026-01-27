import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // Specific routes must come before generic routes
    @Post('create')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Create a new user (Admin only)' })
    async createUser(@Body() userData: any) {
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

    @Get()
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Get all users (Admin only)' })
    findAll() {
        return this.usersService.findAll();
    }

    @Patch(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Update user by ID (Admin only)' })
    updateUser(@Param('id') id: string, @Body() updates: any) {
        return this.usersService.updateUser(id, updates);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Delete user (Admin only)' })
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
