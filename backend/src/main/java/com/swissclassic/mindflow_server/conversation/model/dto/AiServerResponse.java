package com.swissclassic.mindflow_server.conversation.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

// AiServerRequest, AiServerResponse 는 Spring Boot와 Python AI 서버 간의 내부 통신용
// AI 서버와의 통신에 필요한 특수 필드들 포함

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AiServerResponse {
    private String status;
    private String answer;
    private String id;
    private List<AnswerSentence> answerSentences;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerSentence {
        private String sentenceId;
        private String content;
    }
}