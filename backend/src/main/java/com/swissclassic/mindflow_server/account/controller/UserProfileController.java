package com.swissclassic.mindflow_server.account.controller;

import com.swissclassic.mindflow_server.account.model.dto.EditUserProfileRequest;
import com.swissclassic.mindflow_server.account.model.dto.UserProfileResponse;
import com.swissclassic.mindflow_server.account.model.entity.User;
import com.swissclassic.mindflow_server.account.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@SecurityRequirement(name = "bearer-jwt")
public class UserProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/profiles/{userId}")
    @Operation(summary = "프로필 조회", description = "사용자의 userId에 따라 프로필을 조회합니다.",
            security = {@SecurityRequirement(name = "bearer-jwt")})
    public ResponseEntity<?> getUserProfile(
            @PathVariable Long userId, @AuthenticationPrincipal User currentUser
    ) {
        System.out.println("Authentication in controller: " + SecurityContextHolder.getContext()
                                                                                   .getAuthentication());  // Check authentication
        System.out.println("Current user in controller: " + currentUser);  // Check current user

        User user = userRepository.findById(userId)
                                  .orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                 .body("User not found.");
        }
        System.out.println("Current user: " + (currentUser != null ? currentUser.getUsername() : "null"));
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("User not authenticated.");
        }
        Long currentId = currentUser.getId();
        if (!userId.equals(currentId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("You are not allowed to get other user's profile.");
        }
        UserProfileResponse userProfileResponse = new UserProfileResponse(
                user.getAccountId(), user.getEmail(), user.getUsername(), user.getDisplayName());

        return ResponseEntity.status(HttpStatus.OK)
                             .body(userProfileResponse);
    }

    @PostMapping("/profiles/{userId}/patch")
    @Operation(summary = "프로필 수정", description = "사용자의 userId에 따라 프로필을 수정합니다.",
            security = {@SecurityRequirement(name = "bearer-jwt")})
    public ResponseEntity<?> editUserProfile(
            @PathVariable Long userId, @RequestBody EditUserProfileRequest editUserProfileRequest,
            @AuthenticationPrincipal User currentUser
    ) {
        User user = userRepository.findById(userId)
                                  .orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                 .body("User not authenticated.");
        }
        Long currentId = currentUser.getId();
        if (!userId.equals(currentId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("You are not allowed to edit other user's profile.");
        }
        user.setAccountId(editUserProfileRequest.getAccountId());
        user.setUsername(editUserProfileRequest.getUsername());
        user.setDisplayName(editUserProfileRequest.getDisplayName());
        user.setPassword(passwordEncoder.encode(editUserProfileRequest.getPassword()));
        user.setEmail(editUserProfileRequest.getEmail());
        userRepository.save(user);
        return ResponseEntity.status(HttpStatus.OK)
                             .body("Changed profile successfully.");
    }
}
