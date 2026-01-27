import { IsEnum, IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { TransportType } from '../entities/transport-mode.entity';

export class CreateTransportModeDto {
    @IsEnum(TransportType)
    type: TransportType;

    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsNumber()
    maxWeight: number;

    @IsNumber()
    maxVolume: number;

    @IsNumber()
    avgSpeed: number;

    @IsNumber()
    costPerKm: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
