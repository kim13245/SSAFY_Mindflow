package com.swissclassic.mindflow_server.conversation.repository;

import com.swissclassic.mindflow_server.conversation.model.entity.ConversationSummary;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConversationSummaryRepository extends MongoRepository<ConversationSummary, String> {
    void deleteByChatRoomId(long chatRoomId);

    Optional<ConversationSummary> findByChatRoomId(long chatRoomId);

}