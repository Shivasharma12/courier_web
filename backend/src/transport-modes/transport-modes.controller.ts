import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TransportModesService } from './transport-modes.service';
import { CreateTransportModeDto } from './dto/create-transport-mode.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('transport-modes')
@UseGuards(JwtAuthGuard)
export class TransportModesController {
    constructor(private readonly transportModesService: TransportModesService) { }

    @Get()
    findAll() {
        return this.transportModesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.transportModesService.findOne(id);
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    create(@Body() createDto: CreateTransportModeDto) {
        return this.transportModesService.create(createDto);
    }

    @Post('seed')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    async seed() {
        await this.transportModesService.seedDefaultModes();
        return { message: 'Transport modes seeded successfully' };
    }
}
