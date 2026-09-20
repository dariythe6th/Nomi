package com.example.blinkzenly;

import android.content.Intent;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

import com.example.blinkzenly.auth.LoginActivity;
import com.example.blinkzenly.map.MapActivity;
import com.example.blinkzenly.util.FirebaseUtil;

/**
 * П.1 Авторизация: точка входа — проверяем сессию Firebase Auth
 * и направляем либо на экран логина, либо сразу на карту.
 */
public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent target = (FirebaseUtil.currentUser() != null)
                ? new Intent(this, MapActivity.class)
                : new Intent(this, LoginActivity.class);
        startActivity(target);
        finish();
    }
}
