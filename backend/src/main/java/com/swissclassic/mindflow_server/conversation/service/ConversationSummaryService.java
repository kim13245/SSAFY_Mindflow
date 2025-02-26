package com.swissclassic.mindflow_server.conversation.service;

import com.swissclassic.mindflow_server.conversation.model.entity.ConversationSummary;

public interface ConversationSummaryService {
    void saveConversationSummary(ConversationSummary conversationSummary);
    void deleteConversationSummaryByChatRoomId(long chatRoomId);

    ConversationSummary findByChatRoomId(long chatRoomId); // 주제 분리 시 요약본 복사용
}