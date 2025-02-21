package com.swissclassic.mindflow_server.mindmap.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.neo4j.core.schema.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Node("Topic")
@Data
@NoArgsConstructor
public class Topic {
    @Id
    private String id;
    private String title;
    private String content;

    @Property("mongo_ref")
    private String mongoRef;

    @Property("account_id")
    private String accountId;

    @Property("chat_room_id")
    private String chatroomId;

    @Property("created_at")
    private LocalDateTime createdAt;

    @Property("creator_id")
    private Long creatorId;
}
