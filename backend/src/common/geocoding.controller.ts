import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Controller('geocoding')
export class GeocodingController {
    @Get('search')
    async search(@Query('q') query: string) {
        if (!query || query.length < 3) {
            return [];
        }

        try {
            // Using OSM Nominatim API through backend proxy
            const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: query,
                    format: 'json',
                    limit: 10,
                    addressdetails: 1,
                },
                headers: {
                    'User-Agent': 'CourierWebApp-Backend/1.0',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            });

            return response.data;
        } catch (error) {
            console.error('Geocoding error:', error.message);
            throw new HttpException('Failed to fetch location data', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('reverse')
    async reverse(@Query('lat') lat: number, @Query('lng') lng: number) {
        if (!lat || !lng) {
            throw new HttpException('Missing coordinates', HttpStatus.BAD_REQUEST);
        }

        try {
            const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
                params: {
                    lat: lat,
                    lon: lng,
                    format: 'json',
                    addressdetails: 1,
                },
                headers: {
                    'User-Agent': 'CourierWebApp-Backend/1.0',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            });

            // Extract a cleaner display name if possible
            const addr = response.data.address;
            const local = addr?.suburb || addr?.neighbourhood || addr?.village || addr?.colony || addr?.city_district || addr?.road || '';
            const city = addr?.city || addr?.town || addr?.state || '';

            if (local && city) {
                response.data.display_name = `${local}, ${city}`;
            }

            return response.data;
        } catch (error) {
            console.error('Reverse geocoding error:', error.message);
            throw new HttpException('Failed to fetch address details', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
