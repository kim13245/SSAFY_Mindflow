package com.swissclassic.mindflow_server.conversation.model.dto;

import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ChatRoomResponse {
    private long id;
    private String title;
    private LocalDateTime createdAt;
    private Boolean starred;
}
