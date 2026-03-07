export enum ParcelStatus {
    WAITING_FOR_DROP = 'waiting_for_drop', // customer request exists, parcel not yet deposited
    PENDING_MATCH = 'pending_match',
    MATCHED = 'matched',
    BOOKED = 'booked',
    PICKED_UP = 'picked_up',
    AT_HUB = 'at_hub',
    IN_TRANSIT = 'in_transit',
    OUT_FOR_DELIVERY = 'out_for_delivery',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
    EXPIRED = 'expired',               // drop deadline passed without drop-off
}
