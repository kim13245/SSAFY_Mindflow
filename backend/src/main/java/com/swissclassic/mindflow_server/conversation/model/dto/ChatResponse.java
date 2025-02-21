package com.swissclassic.mindflow_server.conversation.model.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

// ChatRequest, ChatResponse 는 클라이언트(프론트엔드)와 Spring Boot 서버 간의 통신
// 실제 비즈니스 로직에 필요한 데이터 구조
// MongoDB에 저장될 데이터 형식과 매칭

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class ChatResponse {
    private String id;
    private String accountId;  // 추가
    private Long chatRoomId;   // 추가
    private String question;
    private String createdAt;
    private List<AnswerSentenceDto> answerSentences;

    @Getter
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor
    @Builder
    public static class AnswerSentenceDto {
        private String sentenceId;
        private String content;
    }
}
