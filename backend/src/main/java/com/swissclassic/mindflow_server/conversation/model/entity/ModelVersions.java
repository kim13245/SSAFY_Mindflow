package com.swissclassic.mindflow_server.conversation.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.Objects;

@Setter
@Getter
@Entity
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "model_versions", schema = "mindflow_db")
public class ModelVersions {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "id")
    private long id;
    @Basic
    @Column(name = "provider_id")
    private long providerId;
    @Basic
    @Column(name = "name")
    private String name;
    @Basic
    @Column(name = "api_name")
    private String apiName;
}
