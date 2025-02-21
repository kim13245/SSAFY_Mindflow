package com.swissclassic.mindflow_server.conversation.model.entity;

import com.swissclassic.mindflow_server.account.model.entity.User;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "chat_rooms")
public class ChatRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true)
    private String title;

    @Column(name = "creator_id", nullable = false)
    private long creatorId;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp // Hibernate가 자동으로 현재 시간 할당 (필요 시 대체 가능)
    private LocalDateTime createdAt;

    @Builder.Default // 빌더 사용 시 기본값 유지
    @Column(nullable = false)
    private Boolean starred = false; // 기본값 FALSE
}
