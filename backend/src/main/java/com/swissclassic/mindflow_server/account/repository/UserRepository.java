package com.swissclassic.mindflow_server.account.repository;

import com.swissclassic.mindflow_server.account.model.entity.OAuthProvider;
import com.swissclassic.mindflow_server.account.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository interface for User entity.
 */
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByAccountId(String accountId);
    Optional<User> findByEmail(String email);
    Optional<User> findById(Long id);
    void deleteAllById(Long id);

    boolean existsByAccountId(String accountId);

    Optional<User> findBySocialProviderAndSocialId(OAuthProvider provider, String id);
}
