package com.swissclassic.mindflow_server.conversation.service;

import com.swissclassic.mindflow_server.conversation.model.entity.ConversationSummary;

public interface ConversationSummaryService {
    void saveConversationSummary(ConversationSummary conversationSummary);
    void deleteConversationSummaryByChatRoomId(long chatRoomId);
}