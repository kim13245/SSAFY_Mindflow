package com.swissclassic.mindflow_server.conversation.model.entity;
import jakarta.persistence.Column;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Data
@Document(collection = "conversation_summaries")
public class ConversationSummary {
    @Id
    private String id;
    @Field(name = "chat_room_id")
    private long chatRoomId;
    @Field(name = "summary_content")
    private String summaryContent;
    @Field(name = "time_stamp")
    private String timestamp;
}