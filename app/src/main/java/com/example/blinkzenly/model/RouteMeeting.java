package com.example.blinkzenly.model;

import java.util.List;

/**
 * Приглашение на встречу с точкой сбора и списком участников.
 * Firestore: meetings/{autoId}
 */
public class RouteMeeting {
    public String id;
    public String ownerUid;
    public List<String> participants;
    public double destLat;
    public double destLng;
    public String placeName;
    public long meetAt;      // время встречи (epoch millis)
    public long createdAt;

    public RouteMeeting() {}

    public RouteMeeting(String ownerUid, List<String> participants, double destLat, double destLng,
                         String placeName, long meetAt, long createdAt) {
        this.ownerUid = ownerUid;
        this.participants = participants;
        this.destLat = destLat;
        this.destLng = destLng;
        this.placeName = placeName;
        this.meetAt = meetAt;
        this.createdAt = createdAt;
    }
}
