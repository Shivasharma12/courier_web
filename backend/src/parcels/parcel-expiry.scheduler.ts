import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ParcelsService } from './parcels.service';

@Injectable()
export class ParcelExpiryScheduler {
    private readonly logger = new Logger(ParcelExpiryScheduler.name);

    constructor(private readonly parcelsService: ParcelsService) { }

    /** Run every hour — expire parcels whose drop deadline has passed */
    @Cron(CronExpression.EVERY_HOUR)
    async handleExpiry() {
        this.logger.log('Running parcel expiry check...');
        const count = await this.parcelsService.expirePendingParcels();
        if (count > 0) {
            this.logger.log(`Expired ${count} parcel(s) past their drop deadline.`);
        }
    }
}
