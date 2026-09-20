package com.example.blinkzenly.chat;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.blinkzenly.R;
import com.example.blinkzenly.util.FirebaseUtil;
import com.google.firebase.firestore.Query;

import java.util.ArrayList;
import java.util.List;

/**
 * П.6 Чаты: список диалогов пользователя.
 * Firestore: chats/{chatId} c полем participants=[uidA, uidB]
 */
public class ChatListActivity extends AppCompatActivity {

    private final List<String> chatIds = new ArrayList<>();
    private final List<String> chatTitles = new ArrayList<>();
    private RecyclerView.Adapter<VH> adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat_list);

        RecyclerView rv = findViewById(R.id.rvChats);
        rv.setLayoutManager(new LinearLayoutManager(this));
        adapter = new RecyclerView.Adapter<VH>() {
            @NonNull @Override
            public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
                View v = LayoutInflater.from(parent.getContext())
                        .inflate(android.R.layout.simple_list_item_1, parent, false);
                return new VH(v);
            }
            @Override
            public void onBindViewHolder(@NonNull VH holder, int position) {
                holder.text.setText(chatTitles.get(position));
                holder.itemView.setOnClickListener(v -> {
                    Intent i = new Intent(ChatListActivity.this, ChatActivity.class);
                    i.putExtra("chatId", chatIds.get(position));
                    startActivity(i);
                });
            }
            @Override
            public int getItemCount() { return chatIds.size(); }
        };
        rv.setAdapter(adapter);

        findViewById(R.id.fabNewChat).setOnClickListener(v -> createOrOpenDemoChat());

        loadChats();
    }

    private void loadChats() {
        String uid = FirebaseUtil.uid();
        FirebaseUtil.firestore().collection("chats")
                .whereArrayContains("participants", uid)
                .addSnapshotListener((snap, e) -> {
                    if (snap == null) return;
                    chatIds.clear();
                    chatTitles.clear();
                    for (var doc : snap.getDocuments()) {
                        chatIds.add(doc.getId());
                        List<String> participants = (List<String>) doc.get("participants");
                        chatTitles.add("Чат: " + (participants != null ? participants.toString() : doc.getId()));
                    }
                    adapter.notifyDataSetChanged();
                });
    }

    /** Демо-заглушка создания чата — в реальном приложении выбор друга из списка друзей. */
    private void createOrOpenDemoChat() {
        String uid = FirebaseUtil.uid();
        var chat = new java.util.HashMap<String, Object>();
        chat.put("participants", List.of(uid, "friend_demo_uid"));
        chat.put("createdAt", System.currentTimeMillis());
        FirebaseUtil.firestore().collection("chats").add(chat);
    }

    static class VH extends RecyclerView.ViewHolder {
        TextView text;
        VH(View v) { super(v); text = v.findViewById(android.R.id.text1); }
    }
}
