package com.swissclassic.mindflow_server.conversation.service;

import com.swissclassic.mindflow_server.conversation.model.dto.*;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatLog;
import com.swissclassic.mindflow_server.conversation.repository.ChatLogRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiServerServiceImpl implements AiServerService {
    private final WebClient aiServerWebClient;

    @Override
    public ChatApiResponse getChatResponse(ChatRequest chatRequest) {
        // 요청 데이터를 생성
        // Flask API 호출 및 응답 처리
        return aiServerWebClient.post()
                .uri("/chatbot/message") // Flask 서버의 엔드포인트
                .header("Content-Type", "application/json")
                .bodyValue(chatRequest) // JSON 데이터 전송
                .retrieve()
                .bodyToMono(ChatApiResponse.class) // 응답 데이터를 문자열로 변환
                .block();
    }
    @Override
    public ChatAllResponse getAllChatResponse(ChatAllRequest chatRequest){
        return aiServerWebClient.post()
                .uri("/chatbot/all") // Flask 서버의 엔드포인트
                .header("Content-Type", "application/json")
                .bodyValue(chatRequest) // JSON 데이터 전송
                .retrieve()
                .bodyToMono(ChatAllResponse.class)
                .block();// 응답 데이터를 문자열로 변환
    }


    @Override
    public void createFirstMindmap(Map<String, Object> request) {
        aiServerWebClient.post()
                .uri("/chatbot/first-mindmap")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Void.class)
                .block();
    }

}