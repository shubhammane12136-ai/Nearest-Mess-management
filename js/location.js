/**
 * Location Service
 * Handles Geolocation API and distance calculations.
 */

class LocationService {
    constructor() {
        this.userLocation = null;
        // DY Patil College, Kasba Bawda Coordinates
        this.DYP_COORDS = {
            lat: 16.7050,
            lng: 74.2433
        };
    }

    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser."));
            } else {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.userLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        resolve(this.userLocation);
                    },
                    (error) => {
                        reject(error);
                    }
                );
            }
        });
    }

    // Haversine Formula to calculate distance in km
    calculateDistance(lat1, lon1, lat2, lon2) {
        if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return Infinity;
        if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return Infinity;

        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return Math.round(d * 10) / 10; // Round to 1 decimal place
    }

    calculateDistanceFromDYP(lat, lng) {
        return this.calculateDistance(this.DYP_COORDS.lat, this.DYP_COORDS.lng, lat, lng);
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    // Helper to get coordinates from a Google Maps Link
    extractCoordinates(url) {
        if (!url) return null;
        try {
            // Check for @lat,lng format
            const regexAt = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
            const matchAt = url.match(regexAt);
            if (matchAt) {
                return {
                    lat: parseFloat(matchAt[1]),
                    lng: parseFloat(matchAt[2])
                };
            }

            // Check for query parameter q=lat,lng
            const urlObj = new URL(url);
            const q = urlObj.searchParams.get('q');
            if (q && q.includes(',')) {
                const parts = q.split(',');
                const lat = parseFloat(parts[0]);
                const lng = parseFloat(parts[1]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    return { lat, lng };
                }
            }

            return null;
        } catch (e) {
            console.error("Error parsing map URL", e);
            return null;
        }
    }
}

export const locationService = new LocationService();
window.locationService = locationService;
