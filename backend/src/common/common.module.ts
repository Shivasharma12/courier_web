import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { GeocodingController } from './geocoding.controller';
import { Notification } from './entities/notification.entity';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([Notification])],
    controllers: [GeocodingController, NotificationsController],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class CommonModule { }
