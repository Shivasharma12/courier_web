import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingLog } from './entities/tracking-log.entity';
import { TrackingGateway } from './tracking.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { TrackingService } from './tracking.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([TrackingLog]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET'),
            }),
        }),
    ],
    providers: [TrackingGateway, TrackingService],
    exports: [TrackingService],
})
export class TrackingModule { }
