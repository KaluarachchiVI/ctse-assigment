package com.ctse.booking.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.NegatedRequestMatcher;

import javax.crypto.SecretKey;

/**
 * JWT (Bearer) for {@code GET /booking/me}. HTTP Basic for admin APIs.
 *
 * <p>Confirmed seats use {@code /booking/public/**} on a chain that does <strong>not</strong> register
 * {@code oauth2ResourceServer()} — otherwise the Bearer filter returns 401 before {@code permitAll}.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /** No JWT / Basic filters on this chain — only this path pattern for public reads. */
    @Bean
    @Order(1)
    public SecurityFilterChain publicBookingChain(HttpSecurity http) throws Exception {
        http.securityMatcher(new AntPathRequestMatcher("/booking/public/**"))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder(
            @Value("${JWT_SECRET:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}") String secret
    ) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET must be set (same value as user-service) for /booking/me"
            );
        }
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        SecretKey key = Keys.hmacShaKeyFor(keyBytes);
        return NimbusJwtDecoder.withSecretKey(key).build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtDecoder jwtDecoder) throws Exception {
        http.securityMatcher(new NegatedRequestMatcher(new AntPathRequestMatcher("/booking/public/**")))
                .csrf(csrf -> csrf.disable())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(j -> j.decoder(jwtDecoder)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/booking").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/booking/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/booking").hasRole("BOOKING_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/booking/**").hasRole("BOOKING_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/bookings/**").hasRole("BOOKING_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/booking/*/ticket").hasRole("BOOKING_ADMIN")
                        .anyRequest().denyAll())
                .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService(
            @Value("${booking.admin.username}") String username,
            @Value("${booking.admin.password}") String password,
            PasswordEncoder encoder
    ) {
        UserDetails admin = User.builder()
                .username(username)
                .password(encoder.encode(password))
                .roles("BOOKING_ADMIN")
                .build();
        return new InMemoryUserDetailsManager(admin);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
