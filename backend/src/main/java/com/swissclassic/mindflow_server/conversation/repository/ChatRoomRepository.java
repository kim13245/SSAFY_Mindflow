package com.swissclassic.mindflow_server.conversation.repository;

import com.swissclassic.mindflow_server.conversation.model.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    List<ChatRoom> findAllByCreatorId(long creatorId);

}
