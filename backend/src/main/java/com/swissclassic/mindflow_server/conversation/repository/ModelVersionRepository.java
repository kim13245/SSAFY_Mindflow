package com.swissclassic.mindflow_server.conversation.repository;

import com.swissclassic.mindflow_server.conversation.model.entity.LlmProviders;
import com.swissclassic.mindflow_server.conversation.model.entity.ModelVersions;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ModelVersionRepository extends JpaRepository<ModelVersions, Long> {
    ModelVersions findFirstById(Long id);
}
