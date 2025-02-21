package com.swissclassic.mindflow_server.conversation.service;


import com.swissclassic.mindflow_server.conversation.model.dto.*;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface AiServerService {
    ChatApiResponse getChatResponse(ChatRequest chatRequest);
    ChatAllResponse getAllChatResponse(ChatAllRequest chatRequest);
    
    // firstChat 시 사용
    void createFirstMindmap(Map<String, Object> request);  // 새로운 메서드
}
