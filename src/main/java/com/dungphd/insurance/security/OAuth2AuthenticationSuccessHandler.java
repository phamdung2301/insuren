package com.dungphd.insurance.security;

import com.dungphd.insurance.model.User;
import com.dungphd.insurance.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * OAuth2AuthenticationSuccessHandler
 *
 * Phân quyền:
 * - Nếu email nằm trong danh sách app.admin.emails → ROLE_ADMIN
 * - Còn lại → ROLE_USER
 *
 * Flow: Google OAuth2 → JWT issued → Redirect về frontend với token
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    @Value("${app.admin.emails:dungphdse@gmail.com,admin@insurtech.vn}")
    private String adminEmailsConfig;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        log.info("Google OAuth2 Authentication Success for: {}", email);

        // Determine role: check against configured admin emails
        Set<String> adminEmails = Arrays.stream(adminEmailsConfig.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        String role = (email != null && adminEmails.contains(email.toLowerCase()))
                ? "ROLE_ADMIN" : "ROLE_USER";

        log.info("Assigned role {} to user {}", role, email);

        // Upsert user in MongoDB
        if (email != null) {
            userRepository.findByEmail(email).ifPresentOrElse(
                existingUser -> {
                    // Update existing user's name if changed
                    if (name != null && !name.equals(existingUser.getFullName())) {
                        existingUser.setFullName(name);
                        userRepository.save(existingUser);
                    }
                    // Update role if it changed (e.g. admin email added later)
                    List<String> newRoles = List.of(role);
                    if (!existingUser.getRoles().equals(newRoles)) {
                        existingUser.setRoles(newRoles);
                        userRepository.save(existingUser);
                        log.info("Updated role for existing user {}", email);
                    }
                },
                () -> {
                    User newUser = User.builder()
                            .email(email)
                            .fullName(name != null ? name : email.split("@")[0])
                            .roles(List.of(role))
                            .enabled(true)
                            .build();
                    userRepository.save(newUser);
                    log.info("Created new user: {}", email);
                }
            );
        }

        // Generate JWT with role embedded
        String token = tokenProvider.generateToken(email, name, List.of(role));

        // URL encode all params
        String encodedEmail  = URLEncoder.encode(email != null ? email : "", StandardCharsets.UTF_8);
        String encodedName   = URLEncoder.encode(name != null ? name : "", StandardCharsets.UTF_8);
        String encodedRole   = URLEncoder.encode(role, StandardCharsets.UTF_8);

        // Redirect to frontend with JWT + user info
        String redirectUrl = String.format(
            "http://localhost:5173/login?token=%s&email=%s&name=%s&role=%s",
            token, encodedEmail, encodedName, encodedRole);

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
