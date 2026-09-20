package com.example.blinkzenly.model;

/**
 * Хранится в Realtime Database: locations/{uid}
 * Realtime DB выбран для гео, т.к. даёт низкую задержку стрима координат друзей.
 */
public class LocationPoint {
    public double lat;
    public double lng;
    public float speed;
    public long timestamp;

    public LocationPoint() {}

    public LocationPoint(double lat, double lng, float speed, long timestamp) {
        this.lat = lat;
        this.lng = lng;
        this.speed = speed;
        this.timestamp = timestamp;
    }
}
