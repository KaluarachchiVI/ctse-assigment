package com.ctse.payment.client;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class UserClient {

    private static final Logger log = LoggerFactory.getLogger(UserClient.class);

    private final RestTemplate restTemplate;

    @Value("${user.service.base-url}")
    private String userServiceBaseUrl;

    /**
     * For local development/testing you can disable user validation by setting
     * environment variable USER_SERVICE_ENABLED=false (relaxed binding to user.service.enabled).
     */
    @Value("${user.service.enabled:false}")
    private boolean userServiceEnabled;

    public boolean userExists(String userId) {
        if (!userServiceEnabled) {
            return true;
        }
        String url = userServiceBaseUrl + "/users/" + userId;
        try {
            URI uri = Objects.requireNonNull(URI.create(url));
            RequestEntity<Void> request = RequestEntity.get(uri).build();
            ResponseEntity<String> response = restTemplate.exchange(request, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception ex) {
            log.error("Failed to verify user {}: {}", userId, ex.getMessage());
            return false;
        }
    }

    /**
     * Fetch a minimal user profile used for ticketing.
     * We intentionally extract fields defensively because the other group's User service response
     * may not expose exact email/name field names.
     */
    public UserProfile fetchUserProfile(String userId) {
        if (!userServiceEnabled) {
            return new UserProfile(Optional.empty(), Optional.empty());
        }

        String url = userServiceBaseUrl + "/users/" + userId;
        try {
            URI uri = Objects.requireNonNull(URI.create(url));
            RequestEntity<Void> request = RequestEntity.get(uri).build();
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    request,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return new UserProfile(Optional.empty(), Optional.empty());
            }

            Map<String, Object> body = response.getBody();

            String email = firstString(body, "email", "userEmail", "mail", "mailAddress");
            String name = firstString(body, "name", "fullName", "userName", "username");

            if (isBlank(name)) {
                String first = firstString(body, "firstName", "givenName");
                String last = firstString(body, "lastName", "familyName");
                if (!isBlank(first) && !isBlank(last)) {
                    name = first.trim() + " " + last.trim();
                } else if (!isBlank(first)) {
                    name = first.trim();
                } else if (!isBlank(last)) {
                    name = last.trim();
                }
            }

            return new UserProfile(Optional.ofNullable(email).filter(UserClient::notBlank),
                    Optional.ofNullable(name).filter(UserClient::notBlank));
        } catch (Exception ex) {
            log.error("Failed to fetch user profile {}: {}", userId, ex.getMessage());
            return new UserProfile(Optional.empty(), Optional.empty());
        }
    }

    public static class UserProfile {
        private final Optional<String> email;
        private final Optional<String> name;

        public UserProfile(Optional<String> email, Optional<String> name) {
            this.email = email;
            this.name = name;
        }

        public Optional<String> getEmail() {
            return email;
        }

        public Optional<String> getName() {
            return name;
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static boolean notBlank(String s) {
        return !isBlank(s);
    }

    private static String firstString(Map<String, Object> body, String... keys) {
        for (String key : keys) {
            Object value = body.get(key);
            if (value instanceof String str && !isBlank(str)) {
                return str;
            }
        }
        return null;
    }
}

