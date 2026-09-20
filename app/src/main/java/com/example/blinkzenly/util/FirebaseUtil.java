package com.example.blinkzenly.util;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.storage.FirebaseStorage;

public class FirebaseUtil {

    public static FirebaseAuth auth() {
        return FirebaseAuth.getInstance();
    }

    public static FirebaseUser currentUser() {
        return auth().getCurrentUser();
    }

    public static String uid() {
        FirebaseUser u = currentUser();
        return u == null ? null : u.getUid();
    }

    public static FirebaseFirestore firestore() {
        return FirebaseFirestore.getInstance();
    }

    public static FirebaseDatabase realtimeDb() {
        return FirebaseDatabase.getInstance();
    }

    public static FirebaseStorage storage() {
        return FirebaseStorage.getInstance();
    }
}
