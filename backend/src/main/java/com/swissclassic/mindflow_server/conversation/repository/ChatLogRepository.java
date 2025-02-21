package com.swissclassic.mindflow_server.conversation.repository;

import com.swissclassic.mindflow_server.conversation.model.entity.ChatLog;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatLogRepository extends MongoRepository<ChatLog, ObjectId> {
    List<ChatLog> findByChatRoomId(long chatRoomId);

//    @Query("{'$or': [{'question': {$regex: ?0, $options: 'i'}}, {'answerSentences.content': {$regex: ?0, $options: 'i'}}]}")
//    List<ChatLog> findBySentenceContent(String searchKeyword);
    @Query("{'$and': [{'userId': ?1}, {'$or': [{'question': {$regex: ?0, $options: 'i'}}, {'answerSentences.content': {$regex: ?0, $options: 'i'}}]}]}")
    List<ChatLog> findBySentenceContent(String searchKeyword, long user_id);

    void deleteByChatRoomId(long chatRoomId);


    @Transactional
    void deleteAllByUserId(Long userId);

}