package com.example.blinkzenly.route;

import android.location.Location;
import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.FragmentActivity;

import com.example.blinkzenly.databinding.ActivityRouteBinding;
import com.example.blinkzenly.model.RouteMeeting;
import com.example.blinkzenly.util.FirebaseUtil;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.gms.maps.model.PolylineOptions;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.Executors;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

import com.example.blinkzenly.R;

/**
 * П.8 Маршруты (встреча): пользователь ставит точку встречи на карте (долгий тап),
 * приложение сохраняет meeting в Firestore и приглашает друга (push через FCM,
 * см. Cloud Function в README), затем строит маршрут до точки через
 * Directions API и рисует его линией на карте.
 *
 * Примечание: для полноценного HTTP-запроса к Directions API добавьте в build.gradle
 * зависимость 'com.squareup.okhttp3:okhttp:4.12.0' — здесь она предполагается подключённой.
 */
public class RouteActivity extends FragmentActivity implements OnMapReadyCallback {

    private static final String DIRECTIONS_API_KEY = "ВАШ_GOOGLE_MAPS_API_KEY";

    private ActivityRouteBinding b;
    private GoogleMap map;
    private LatLng destination;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        b = ActivityRouteBinding.inflate(getLayoutInflater());
        setContentView(b.getRoot());

        SupportMapFragment mapFragment = (SupportMapFragment)
                getSupportFragmentManager().findFragmentById(R.id.mapFragmentContainer);
        if (mapFragment != null) mapFragment.getMapAsync(this);

        b.btnCreateMeeting.setOnClickListener(v -> createMeeting());
        }

    @Override
    public void onMapReady(GoogleMap googleMap) {
        map = googleMap;
        map.setOnMapLongClickListener(latLng -> {
            map.clear();
            destination = latLng;
            map.addMarker(new MarkerOptions().position(latLng).title("Точка встречи"));
            drawRouteFromMyLocation(latLng);
        });
    }

    private void drawRouteFromMyLocation(LatLng dest) {
        if (androidx.core.app.ActivityCompat.checkSelfPermission(this,
                android.Manifest.permission.ACCESS_FINE_LOCATION)
                != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            androidx.core.app.ActivityCompat.requestPermissions(this,
                    new String[]{android.Manifest.permission.ACCESS_FINE_LOCATION}, 100);
            return;
        }
        LocationServices.getFusedLocationProviderClient(this).getLastLocation()
                .addOnSuccessListener(loc -> {
                    if (loc == null) return;
                    LatLng origin = new LatLng(loc.getLatitude(), loc.getLongitude());
                    map.moveCamera(CameraUpdateFactory.newLatLngZoom(origin, 13f));
                    fetchDirections(origin, dest);
                });
    }

    /** Запрос маршрута к Directions API и отрисовка полилинии (упрощённый парсинг overview_polyline). */
    private void fetchDirections(LatLng origin, LatLng dest) {
        Executors.newSingleThreadExecutor().execute(() -> {
            try {
                String url = "https://maps.googleapis.com/maps/api/directions/json"
                        + "?origin=" + origin.latitude + "," + origin.longitude
                        + "&destination=" + dest.latitude + "," + dest.longitude
                        + "&key=" + DIRECTIONS_API_KEY;

                OkHttpClient client = new OkHttpClient();
                Request request = new Request.Builder().url(url).build();
                try (Response response = client.newCall(request).execute()) {
                    String body = response.body() != null ? response.body().string() : "";
                    JSONObject json = new JSONObject(body);
                    JSONArray routes = json.getJSONArray("routes");
                    if (routes.length() == 0) return;
                    String encoded = routes.getJSONObject(0)
                            .getJSONObject("overview_polyline").getString("points");
                    List<LatLng> path = decodePolyline(encoded);

                    runOnUiThread(() -> {
                        if (map != null) {
                            map.addPolyline(new PolylineOptions().addAll(path).width(10));
                        }
                    });
                }
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(this, "Не удалось построить маршрут: " + e.getMessage(), Toast.LENGTH_LONG).show());
            }
        });
    }

    private void createMeeting() {
        if (destination == null) {
            Toast.makeText(this, "Долгий тап по карте — выберите точку встречи", Toast.LENGTH_SHORT).show();
            return;
        }
        String uid = FirebaseUtil.uid();
        long meetAt = System.currentTimeMillis() + 30 * 60 * 1000; // через 30 минут, для демо

        RouteMeeting meeting = new RouteMeeting(uid, Collections.singletonList(uid),
                destination.latitude, destination.longitude, "Точка встречи", meetAt, System.currentTimeMillis());

        FirebaseUtil.firestore().collection("meetings").add(meeting)
                .addOnSuccessListener(doc -> Toast.makeText(this, "Встреча создана, приглашение отправлено", Toast.LENGTH_SHORT).show())
                .addOnFailureListener(e -> Toast.makeText(this, "Ошибка: " + e.getMessage(), Toast.LENGTH_SHORT).show());
        // Отправку push-приглашения участникам выполняет Cloud Function-триггер на создание meetings/{id} (см. README).
    }

    /** Стандартный алгоритм декодирования Google encoded polyline. */
    private List<LatLng> decodePolyline(String encoded) {
        List<LatLng> poly = new java.util.ArrayList<>();
        int index = 0, len = encoded.length();
        int lat = 0, lng = 0;

        while (index < len) {
            int b, shift = 0, result = 0;
            do {
                b = encoded.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            int dlat = ((result & 1) != 0) ? ~(result >> 1) : (result >> 1);
            lat += dlat;

            shift = 0;
            result = 0;
            do {
                b = encoded.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            int dlng = ((result & 1) != 0) ? ~(result >> 1) : (result >> 1);
            lng += dlng;

            poly.add(new LatLng(lat / 1E5, lng / 1E5));
        }
        return poly;
    }
}
