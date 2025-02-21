package com.swissclassic.mindflow_server.conversation.model.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.List;


@Data
@Document(collection = "chat_logs")
public class ChatLog {
    @Id
    private String id;


    @Field(name = "chat_room_id")
    private long chatRoomId;

    String model;

    @Field(name = "detail_model")
    private String detailModel;


    private String question;
    @Field(name = "user_id")
    private long userId;

    @Field(name = "answer_sentences")
    private List<AnswerSentence> answerSentences;
    @Field(name = "created_at")
    private LocalDateTime createdAt;
    private boolean processed;
}
