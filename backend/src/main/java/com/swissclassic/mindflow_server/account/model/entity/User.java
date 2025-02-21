package com.swissclassic.mindflow_server.account.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * 유저 모델 정의.
 * <p>
 * 이 클래스는 데이터베이스의 {@code users} 테이블과 매핑되며, 사용자 정보를 저장하고 관리합니다.
 * 사용자는 계정 ID, 사용자명, 비밀번호, 이메일 등 다양한 속성을 가지고 있으며,
 * 소셜 로그인 제공자 정보와 잔액 정보도 포함됩니다.
 * </p>
 *
 * <p>
 * 주요 기능:
 * <ul>
 *   <li>사용자 정보의 생성, 조회, 수정, 삭제</li>
 *   <li>리프레시 토큰 관리</li>
 *   <li>사용자 잔액 관리</li>
 * </ul>
 * </p>
 *
 * @author KangMin Lee
 * @version 1.0
 * @since 2025-01-31
 */
@Entity
@Getter
@Setter
@Table(name = "users")
@NoArgsConstructor
@AllArgsConstructor
public class User implements OAuth2User, UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String accountId;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(length = 100)
    private String displayName;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Column(length = 255)
    private String refreshToken;

    @Column(length = 50)
    @Enumerated(EnumType.STRING)
    private OAuthProvider socialProvider = OAuthProvider.NONE;  // Add this field

    @Column(length = 255)
    private String socialId;              // Add this field

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", accountId='" + accountId + '\'' +
                ", username='" + username + '\'' +
                ", password='" + password + '\'' +
                ", displayName='" + displayName + '\'' +
                ", email='" + email + '\'' +
                ", createdAt=" + createdAt +
                ", refreshToken='" + refreshToken + '\'' +
                ", socialProvider=" + socialProvider +
                ", socialId='" + socialId + '\'' +
                '}';
    }

    @Override
    public <A> A getAttribute(String name) {
        return OAuth2User.super.getAttribute(name);
    }

    @Override
    public Map<String, Object> getAttributes() {
        return null;
    }

    @Override
    public List<? extends GrantedAuthority> getAuthorities() {
        // Return the roles/authorities assigned to the user.
        // For now, if there are none, you can return an empty list:
        return Collections.emptyList();
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public String getUsername() {
        return this.username;
    }

    // For simplicity, return true for the following.
    // In a real application, you would add proper logic.
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }


    @Override
    public String getName() {
        return null;
    }
}