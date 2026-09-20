package com.example.blinkzenly.auth;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.example.blinkzenly.databinding.ActivityLoginBinding;
import com.example.blinkzenly.map.MapActivity;
import com.example.blinkzenly.util.FirebaseUtil;
import com.google.firebase.auth.FirebaseAuth;

/**
 * П.1 Авторизация — вход по email/паролю через Firebase Auth.
 */
public class LoginActivity extends AppCompatActivity {

    private ActivityLoginBinding b;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        b = ActivityLoginBinding.inflate(getLayoutInflater());
        setContentView(b.getRoot());

        b.btnLogin.setOnClickListener(v -> login());
        b.tvGoRegister.setOnClickListener(v ->
                startActivity(new Intent(this, RegisterActivity.class)));
    }

    private void login() {
        String email = b.etEmail.getText().toString().trim();
        String pass = b.etPassword.getText().toString().trim();
        if (email.isEmpty() || pass.isEmpty()) {
            Toast.makeText(this, "Заполните email и пароль", Toast.LENGTH_SHORT).show();
            return;
        }
        b.progress.setVisibility(View.VISIBLE);

        FirebaseUtil.auth().signInWithEmailAndPassword(email, pass)
                .addOnCompleteListener(task -> {
                    b.progress.setVisibility(View.GONE);
                    if (task.isSuccessful()) {
                        startActivity(new Intent(this, MapActivity.class));
                        finish();
                    } else {
                        Toast.makeText(this, "Ошибка входа: " +
                                (task.getException() != null ? task.getException().getMessage() : ""),
                                Toast.LENGTH_LONG).show();
                    }
                });
    }
}
