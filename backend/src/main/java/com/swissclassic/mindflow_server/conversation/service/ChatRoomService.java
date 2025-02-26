package com.swissclassic.mindflow_server.conversation.service;


import com.swissclassic.mindflow_server.conversation.model.dto.ChatRoomResponse;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatRoom;

import java.util.List;

public interface ChatRoomService {
    ChatRoom createChatRoom(String title, Long creatorId);
    List<ChatRoom> getAllChatRooms();
    ChatRoom getChatRoomById(Long id);
    String getTitle(String input);
    List<ChatRoomResponse> findAllByCreatorId(long creatorId);
    void deleteChatRoomById(Long id);

    void toggleStarredStatus(Long id);
}
