package com.example.blinkzenly.chat;

import android.content.Intent;
import android.net.Uri;
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
import com.example.blinkzenly.model.ChatMessage;
import com.example.blinkzenly.util.FirebaseUtil;
import com.google.firebase.firestore.Query;

import java.util.ArrayList;
import java.util.List;

/**
 * П.6 Чаты: лента сообщений; текстовые сообщения — обычные пузыри,
 * TYPE_CIRCLE — воспроизводится в CircleVideoView (круглое видео).
 */
public class ChatActivity extends AppCompatActivity {

    private String chatId;
    private final List<ChatMessage> messages = new ArrayList<>();
    private RecyclerView.Adapter<RecyclerView.ViewHolder> adapter;

    private static final int TYPE_TEXT = 0;
    private static final int TYPE_CIRCLE = 1;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat);
        chatId = getIntent().getStringExtra("chatId");

        RecyclerView rv = findViewById(R.id.rvMessages);
        rv.setLayoutManager(new LinearLayoutManager(this));
        adapter = buildAdapter();
        rv.setAdapter(adapter);

        findViewById(R.id.btnSendText).setOnClickListener(v -> sendText());
        findViewById(R.id.btnRecordCircle).setOnClickListener(v -> {
            Intent i = new Intent(this, CircleRecordActivity.class);
            i.putExtra("chatId", chatId);
            startActivity(i);
        });

        listenMessages();
    }

    private void sendText() {
        TextView et = findViewById(R.id.etMessage);
        String text = et.getText().toString().trim();
        if (text.isEmpty()) return;
        ChatMessage msg = ChatMessage.text(FirebaseUtil.uid(), text, System.currentTimeMillis());
        FirebaseUtil.firestore().collection("chats").document(chatId)
                .collection("messages").add(msg);
        et.setText("");
    }

    private void listenMessages() {
        FirebaseUtil.firestore().collection("chats").document(chatId)
                .collection("messages")
                .orderBy("timestamp", Query.Direction.ASCENDING)
                .addSnapshotListener((snap, e) -> {
                    if (snap == null) return;
                    messages.clear();
                    for (var doc : snap.getDocuments()) {
                        messages.add(doc.toObject(ChatMessage.class));
                    }
                    adapter.notifyDataSetChanged();
                });
    }

    private RecyclerView.Adapter<RecyclerView.ViewHolder> buildAdapter() {
        return new RecyclerView.Adapter<>() {
            @Override
            public int getItemViewType(int position) {
                return ChatMessage.TYPE_CIRCLE.equals(messages.get(position).type) ? TYPE_CIRCLE : TYPE_TEXT;
            }

            @NonNull @Override
            public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
                if (viewType == TYPE_CIRCLE) {
                    CircleVideoView videoView = new CircleVideoView(parent.getContext());
                    videoView.setLayoutParams(new ViewGroup.LayoutParams(280, 280));
                    return new RecyclerView.ViewHolder(videoView) {};
                }
                View v = LayoutInflater.from(parent.getContext())
                        .inflate(android.R.layout.simple_list_item_1, parent, false);
                return new RecyclerView.ViewHolder(v) {};
            }

            @Override
            public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
                ChatMessage m = messages.get(position);
                if (ChatMessage.TYPE_CIRCLE.equals(m.type)) {
                    ((CircleVideoView) holder.itemView).playCircle(Uri.parse(m.mediaUrl));
                } else {
                    ((TextView) holder.itemView.findViewById(android.R.id.text1)).setText(m.text);
                }
            }

            @Override
            public int getItemCount() { return messages.size(); }
        };
    }
}
