package com.dungphd.insurance.controller;

import com.dungphd.insurance.dto.response.ApiResponse;
import com.dungphd.insurance.model.User;
import com.dungphd.insurance.repository.UserRepository;
import com.dungphd.insurance.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    @Value("${app.admin.emails:dungphdse@gmail.com,admin@insurtech.vn}")
    private String adminEmailsConfig;

    public record LoginRequest(String email, String fullName, String role) {}

    public record AuthResponse(
            String token,
            String email,
            String fullName,
            String role
    ) {}

    /**
     * POST /auth/login - Đăng nhập bằng Email/OTP hoặc Dev Login
     * Tự động phân quyền: Nếu email thuộc app.admin.emails -> ROLE_ADMIN, ngược lại ROLE_USER.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest request) {
        String email = (request.email() != null) ? request.email().trim().toLowerCase() : "user@customer.vn";
        String fullName = (request.fullName() != null && !request.fullName().isBlank())
                ? request.fullName().trim()
                : email.split("@")[0].toUpperCase();

        Set<String> adminEmails = Arrays.stream(adminEmailsConfig.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        // Assign role
        String role = (request.role() != null && !request.role().isBlank())
                ? request.role()
                : (adminEmails.contains(email) ? "ROLE_ADMIN" : "ROLE_USER");

        // Upsert user in database
        userRepository.findByEmail(email).ifPresentOrElse(
                user -> {
                    user.setFullName(fullName);
                    user.setRoles(List.of(role));
                    userRepository.save(user);
                },
                () -> {
                    User newUser = User.builder()
                            .email(email)
                            .fullName(fullName)
                            .roles(List.of(role))
                            .enabled(true)
                            .createdAt(java.time.Instant.now())
                            .updatedAt(java.time.Instant.now())
                            .build();
                    userRepository.save(newUser);
                }
        );

        String token = tokenProvider.generateToken(email, fullName, List.of(role));
        log.info("Issued JWT for {} with role {}", email, role);

        return ResponseEntity.ok(ApiResponse.success(
                new AuthResponse(token, email, fullName, role),
                "Đăng nhập thành công với vai trò " + role
        ));
    }

    /**
     * GET /auth/me - Kiểm tra danh tính hiện tại từ token
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getProfile(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Thiếu Authorization header"));
        }

        String token = authHeader.substring(7);
        if (!tokenProvider.validateToken(token)) {
            return ResponseEntity.status(401).body(ApiResponse.error("Token không hợp lệ hoặc đã hết hạn"));
        }

        String email = tokenProvider.getEmailFromToken(token);
        List<String> roles = tokenProvider.getRolesFromToken(token);
        String role = (roles != null && !roles.isEmpty()) ? roles.get(0) : "ROLE_USER";

        return ResponseEntity.ok(ApiResponse.success(
                new AuthResponse(token, email, email.split("@")[0].toUpperCase(), role),
                "Xác thực danh tính thành công"
        ));
    }
}
