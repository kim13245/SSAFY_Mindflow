package com.swissclassic.mindflow_server.conversation.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// AiServerRequest, AiServerResponse 는 Spring Boot와 Python AI 서버 간의 내부 통신용
// AI 서버와의 통신에 필요한 특수 필드들 포함

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiServerRequest {
    private String accountId;
    private Long chatRoomId;
    private String question;
}

