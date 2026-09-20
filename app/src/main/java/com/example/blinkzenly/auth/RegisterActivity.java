package com.example.blinkzenly.auth;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.example.blinkzenly.databinding.ActivityRegisterBinding;
import com.example.blinkzenly.map.MapActivity;
import com.example.blinkzenly.model.User;
import com.example.blinkzenly.util.FirebaseUtil;

/**
 * П.1 Авторизация — регистрация нового пользователя + создание профиля в Firestore.
 */
public class RegisterActivity extends AppCompatActivity {

    private ActivityRegisterBinding b;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        b = ActivityRegisterBinding.inflate(getLayoutInflater());
        setContentView(b.getRoot());

        b.btnRegister.setOnClickListener(v -> register());
    }

    private void register() {
        String name = b.etName.getText().toString().trim();
        String email = b.etEmail.getText().toString().trim();
        String pass = b.etPassword.getText().toString().trim();

        if (name.isEmpty() || email.isEmpty() || pass.length() < 6) {
            Toast.makeText(this, "Имя, email и пароль (мин. 6 симв.)", Toast.LENGTH_SHORT).show();
            return;
        }
        b.progress.setVisibility(View.VISIBLE);

        FirebaseUtil.auth().createUserWithEmailAndPassword(email, pass)
                .addOnCompleteListener(task -> {
                    if (!task.isSuccessful()) {
                        b.progress.setVisibility(View.GONE);
                        Toast.makeText(this, "Ошибка регистрации: " +
                                (task.getException() != null ? task.getException().getMessage() : ""),
                                Toast.LENGTH_LONG).show();
                        return;
                    }
                    String uid = FirebaseUtil.uid();
                    User user = new User(uid, name);
                    FirebaseUtil.firestore().collection("users").document(uid)
                            .set(user)
                            .addOnCompleteListener(t2 -> {
                                b.progress.setVisibility(View.GONE);
                                startActivity(new Intent(this, MapActivity.class));
                                finish();
                            });
                });
    }
}
