package com.dungphd.insurance.config;

import com.dungphd.insurance.security.JwtAuthenticationFilter;
import com.dungphd.insurance.security.OAuth2AuthenticationSuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * SecurityConfig - Phân quyền RBAC rõ ràng:
 *
 * ROLE_ADMIN: Toàn quyền - quản lý tất cả policies, xem reports, import/export Excel, benchmark
 * ROLE_USER:  Tạo policy mới (BuyInsurance), xem policy của chính mình, không xoá/không quản trị
 * PUBLIC:     Chỉ xem homepage và OAuth2 login flow
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final OAuth2AuthenticationSuccessHandler oAuth2SuccessHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // ─── 0. PUBLIC: Preflight OPTIONS requests ────────────────────────
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ─── 1. PUBLIC: OAuth2 & Auth callbacks ───────────────────────────
                        .requestMatchers("/", "/error", "/favicon.ico").permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()

                        // ─── 2. PUBLIC: Quick-calculate endpoint (no auth needed for UX) ──
                        .requestMatchers(HttpMethod.POST, "/excel/calculate").permitAll()
                        .requestMatchers(HttpMethod.GET, "/excel/current-rates").permitAll()

                        // ─── 3. ADMIN ONLY: Reports, benchmark, Excel admin tools ──────────
                        .requestMatchers("/reports/**").hasRole("ADMIN")
                        .requestMatchers("/benchmark/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/excel/template").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/excel/import-rates").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/excel/policy/*/download").hasAnyRole("ADMIN", "USER")

                        // ─── 4. ADMIN ONLY: Delete policies ──────────────────────────────
                        .requestMatchers(HttpMethod.DELETE, "/policies/**").hasRole("ADMIN")

                        // ─── 5. USER + ADMIN: Status transitions (lifecycle management) ─────
                        .requestMatchers(HttpMethod.POST, "/policies/*/status-transitions").hasAnyRole("ADMIN", "USER")

                        // ─── 6. USER + ADMIN: Endorsements ─────────────────────────────────
                        .requestMatchers(HttpMethod.POST, "/policies/*/endorsements").hasAnyRole("ADMIN", "USER")

                        // ─── 7. USER + ADMIN: Create policy (BuyInsurance flow) ───────────
                        .requestMatchers(HttpMethod.POST, "/policies").hasAnyRole("ADMIN", "USER")

                        // ─── 8. USER + ADMIN: Location & Coverage CRUD ────────────────────
                        .requestMatchers(HttpMethod.POST, "/policies/*/locations/**").hasAnyRole("ADMIN", "USER")
                        .requestMatchers(HttpMethod.PUT, "/policies/*/locations/**").hasAnyRole("ADMIN", "USER")
                        .requestMatchers(HttpMethod.DELETE, "/policies/*/locations/**").hasRole("ADMIN")

                        // ─── 9. USER + ADMIN: Read policies ──────────────────────────────
                        .requestMatchers(HttpMethod.GET, "/policies/**").hasAnyRole("ADMIN", "USER")
                        .requestMatchers(HttpMethod.PUT, "/policies/**").hasRole("ADMIN")

                        // ─── 9b. USER + ADMIN: Claims (ownership enforced in service layer)
                        .requestMatchers("/claims/**").hasAnyRole("ADMIN", "USER")

                        // ─── 10. Catch-all: Require authentication ────────────────────────
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler((request, response, exception) -> {
                            String errorMsg = java.net.URLEncoder.encode(
                                    exception.getMessage() != null ? exception.getMessage() : "OAuth2 login failed",
                                    java.nio.charset.StandardCharsets.UTF_8);
                            response.sendRedirect("http://localhost:5173/login?error=" + errorMsg);
                        })
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
