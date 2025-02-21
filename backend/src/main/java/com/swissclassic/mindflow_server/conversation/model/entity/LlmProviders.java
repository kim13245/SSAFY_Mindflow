package com.swissclassic.mindflow_server.conversation.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.Objects;

@Setter
@Getter
@Entity
@EqualsAndHashCode
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Table(name = "llm_providers", schema = "mindflow_db")
public class LlmProviders {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "id")
    private long id;
    @Basic
    @Column(name = "name")
    private String name;
    @Basic
    @Column(name = "api_address")
    private String apiAddress;
}
