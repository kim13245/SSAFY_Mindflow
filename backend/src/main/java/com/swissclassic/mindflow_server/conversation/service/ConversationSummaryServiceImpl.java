package com.swissclassic.mindflow_server.conversation.service;

import com.swissclassic.mindflow_server.conversation.model.entity.ConversationSummary;
import com.swissclassic.mindflow_server.conversation.repository.ConversationSummaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ConversationSummaryServiceImpl implements ConversationSummaryService {

    private final ConversationSummaryRepository repository;


    @Override
    public void saveConversationSummary(ConversationSummary conversationSummary) {
        repository.save(conversationSummary);
    }
    @Override
    public void deleteConversationSummaryByChatRoomId(long chatRoomId) {
        repository.deleteByChatRoomId(chatRoomId);
    }
}