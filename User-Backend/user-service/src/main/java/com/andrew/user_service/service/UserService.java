package com.andrew.user_service.service;

import com.andrew.user_service.config.JwtUtils;
import com.andrew.user_service.dto.BookingDTO;
import com.andrew.user_service.model.Usermodel;
import com.andrew.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final RestTemplate restTemplate;

    @Value("${booking.service.url}")
    private String bookingServiceUrl;

    public List<BookingDTO> getBookingsForUser(String userId) {
        String url = bookingServiceUrl + "/booking/user/" + userId;
        try {
            return restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<BookingDTO>>() {}
            ).getBody();
        } catch (Exception e) {
            // Log the error and return empty list to prevent user-service from crashing (500)
            // if booking-service is down or port is misconfigured.
            return new ArrayList<>();
        }
    }

    public Usermodel register(Usermodel user) {
        if (user.getPasswordHash() == null) {
            throw new RuntimeException("Password is required");
        }

        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        user.setRole("USER"); // All new registrations are 'USER' by default
        user.setCreatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public String login(String email, String password) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );
        var user = userRepository.findByEmail(email)
                .orElseThrow();
        return jwtUtils.generateToken(user);
    }

    public Optional<Usermodel> getUserById(String id) {
        return userRepository.findById(id);
    }

    public Optional<Usermodel> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Usermodel updateUser(String id, Usermodel userDetails) {
        Usermodel user = userRepository.findById(id).orElseThrow();
        user.setName(userDetails.getName());
        user.setPhone(userDetails.getPhone());
        // Email is unique and usually not allowed to change easily in this context
        return userRepository.save(user);
    }
}
