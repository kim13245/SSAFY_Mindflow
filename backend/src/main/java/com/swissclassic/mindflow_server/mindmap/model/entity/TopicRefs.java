package com.swissclassic.mindflow_server.mindmap.model.entity;

import lombok.*;
import org.springframework.data.neo4j.core.schema.Property;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TopicRefs {
    private String mongo_ref;  // 언더스코어 형식으로 변경
    private String chat_room_id;  // 언더스코어 형식으로 변경
}