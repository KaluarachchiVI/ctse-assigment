package com.andrew.user_service.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.andrew.user_service.model.Usermodel;
import com.andrew.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        String subject = null;
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        jwt = authHeader.substring(7);
        try {
            subject = jwtUtils.extractUsername(jwt);
        } catch (Exception e) {
            logger.warn("JWT parsing failed: " + e.getMessage());
            subject = null;
        }
        if (subject != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            java.util.Optional<Usermodel> userOpt = userRepository.findById(subject);
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByEmail(subject);
            }
            if (userOpt.isPresent()) {
                Usermodel user = userOpt.get();
                if (jwtUtils.tokenMatchesUser(jwt, user)) {
                    String role = user.getRole() != null ? user.getRole().toUpperCase() : "USER";
                    System.out.println("DEBUG: user-service mapped role: " + role);
                    UserDetails userDetails = new User(
                            user.getEmail(),
                            user.getPasswordHash(),
                            java.util.Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role))
                    );
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        }
        filterChain.doFilter(request, response);
    }
}
