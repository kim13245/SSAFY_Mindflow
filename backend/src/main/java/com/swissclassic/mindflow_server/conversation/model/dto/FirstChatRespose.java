package com.swissclassic.mindflow_server.conversation.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor
@Builder
public class FirstChatRespose {
    @JsonProperty("chat_room_id")
    private long chatRoomId;
}
