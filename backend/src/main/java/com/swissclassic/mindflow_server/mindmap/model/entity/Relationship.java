package com.swissclassic.mindflow_server.mindmap.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.neo4j.core.schema.*;

import java.time.LocalDateTime;

@RelationshipProperties
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Relationship {
    @Id
    @GeneratedValue
    private Long id;

    @Property("type")
    private String type;  // HAS_SUBTOPIC, RELATED_TO, COMPARED_TO

    private Topic source;

    @TargetNode
    private Topic target;

    @Property("created_at")
    private LocalDateTime createdAt;
}