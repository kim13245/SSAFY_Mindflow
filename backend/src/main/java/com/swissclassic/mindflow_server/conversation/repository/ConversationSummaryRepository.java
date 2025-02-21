package com.swissclassic.mindflow_server.conversation.repository;

import com.swissclassic.mindflow_server.conversation.model.entity.ConversationSummary;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConversationSummaryRepository extends MongoRepository<ConversationSummary, String> {
    void deleteByChatRoomId(long chatRoomId);
}