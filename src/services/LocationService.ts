import * as Location from 'expo-location';

class LocationService {
    async requestPermissions(): Promise<boolean> {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
    }

    async getCurrentLocation(): Promise<Location.LocationObject | null> {
        try {
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                throw new Error('Location permission denied');
            }
            return await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
        } catch (error) {
            console.error('Error getting location:', error);
            return null;
        }
    }

    async watchLocation(callback: (location: Location.LocationObject) => void): Promise<Location.LocationSubscription> {
        return await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                distanceInterval: 10,
            },
            callback
        );
    }
}

export default new LocationService();
