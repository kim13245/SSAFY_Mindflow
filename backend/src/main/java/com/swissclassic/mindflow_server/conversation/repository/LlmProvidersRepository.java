package com.swissclassic.mindflow_server.conversation.repository;

import com.swissclassic.mindflow_server.conversation.model.entity.LlmProviders;
import com.swissclassic.mindflow_server.conversation.model.entity.ModelVersions;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LlmProvidersRepository extends JpaRepository<LlmProviders, Long> {
    LlmProviders findFirstById(Long id);
}
