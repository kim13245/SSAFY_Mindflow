package com.swissclassic.mindflow_server.account.service;

import com.swissclassic.mindflow_server.account.model.entity.User;
import com.swissclassic.mindflow_server.account.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PasswordResetService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JavaMailSender mailSender;
    private Map<String, String> tokens = new ConcurrentHashMap<>();
    @Value("${mail.sender.address}")
    private String senderAddress;

    /**
     * Initiates the password reset flow.
     * Verifies that the accountId and email match a user in the database,
     * generates a random token, saves it, and sends it via email.
     *
     * @param accountId the user’s account identifier
     * @param email     the user’s email address
     * @return true if the process is initiated successfully, false otherwise.
     */
    public boolean initiatePasswordReset(String accountId, String email) {
        // Verify that the account exists and that the email matches.
        User user = userRepository.findByAccountId(accountId)
                                  .filter(u -> u.getEmail()
                                                .equalsIgnoreCase(email))
                                  .orElse(null);

        if (user == null) {
            return false;
        }

        // Generate a random alphanumeric token.
        String token = generateRandomToken();

        // Save the token associated with the accountId.
        tokens.put(accountId, token);

        // Send the token by email.
        sendResetTokenEmail(email, token);

        return true;
    }

    /**
     * Verifies if the provided token matches the one stored for the given account.
     *
     * @param accountId the user’s account identifier
     * @param token     the token to verify
     * @return true if the token is valid, false otherwise.
     */
    public boolean verifyToken(String accountId, String token) {
        return token.equals(tokens.get(accountId));
    }

    /**
     * Resets the user's password if the provided token is valid.
     *
     * @param accountId   the user’s account identifier
     * @param token       the token provided by the user
     * @param newPassword the new password to set
     * @return true if the password was successfully reset, false otherwise.
     */
    public boolean resetPassword(String accountId, String token, String newPassword) {
        if (!verifyToken(accountId, token)) {
            return false;
        }
        // Retrieve the user.
        User user = userRepository.findByAccountId(accountId)
                                  .orElse(null);
        if (user == null) {
            return false;
        }

        // Update the user's password.
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Remove the token from the store.
        tokens.remove(accountId);
        return true;
    }

    // Generates a random alphanumeric token.
    private String generateRandomToken() {
        SecureRandom random = new SecureRandom();
        Integer number = random.nextInt(1_000_000); // generates a number between 0 and 999999
        return String.format("%06d", number);  // pads with leading zeros if necessary
    }

    // Sends the token to the user’s email.
    private void sendResetTokenEmail(String email, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderAddress);
        message.setTo(email);
        message.setSubject("Password Reset Token");
        message.setText("Your password reset token is: " + token);
        mailSender.send(message);
    }
}
