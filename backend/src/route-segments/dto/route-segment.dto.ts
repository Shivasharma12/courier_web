import { IsUUID, IsNumber, IsEnum, IsOptional, IsString } from 'class-validator';
import { RouteSegmentStatus } from '../entities/route-segment.entity';

export class CreateRouteSegmentDto {
    @IsUUID()
    parcelId: string;

    @IsNumber()
    segmentOrder: number;

    @IsUUID()
    fromHubId: string;

    @IsUUID()
    toHubId: string;

    @IsUUID()
    transportModeId: string;

    @IsUUID()
    @IsOptional()
    deliveryPersonId?: string;

    @IsNumber()
    distance: number;

    @IsNumber()
    estimatedCost: number;

    @IsEnum(RouteSegmentStatus)
    @IsOptional()
    status?: RouteSegmentStatus;
}

export class UpdateRouteSegmentDto {
    @IsEnum(RouteSegmentStatus)
    @IsOptional()
    status?: RouteSegmentStatus;

    @IsUUID()
    @IsOptional()
    deliveryPersonId?: string;

    @IsString()
    @IsOptional()
    pickupOtp?: string;

    @IsString()
    @IsOptional()
    deliveryOtp?: string;
}
