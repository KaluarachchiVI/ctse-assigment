package com.ctse.payment.client;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Objects;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class BookingClient {

    private static final Logger log = LoggerFactory.getLogger(BookingClient.class);

    private final RestTemplate restTemplate;

    @Value("${booking.service.base-url}")
    private String bookingServiceBaseUrl;

    @Value("${booking.admin.username:admin}")
    private String bookingAdminUsername;

    @Value("${booking.admin.password:admin-pass}")
    private String bookingAdminPassword;

    private void applyAdminAuth(HttpHeaders headers) {
        String username = bookingAdminUsername == null ? "admin" : bookingAdminUsername;
        String password = bookingAdminPassword == null ? "admin-pass" : bookingAdminPassword;
        headers.setBasicAuth(username, password);
    }

    public void updateBookingStatus(String bookingId, String status) {
        String url = bookingServiceBaseUrl + "/bookings/" + bookingId + "/status";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        applyAdminAuth(headers);
        try {
            Map<String, String> body = Map.of("status", status);
            restTemplate.exchange(
                    url,
                    Objects.requireNonNull(HttpMethod.PUT),
                    new HttpEntity<>(body, headers),
                    Void.class
            );
            log.info("Updated booking {} status to {}", bookingId, status);
        } catch (Exception ex) {
            log.error("Failed to update booking {} status to {}: {}", bookingId, status, ex.getMessage());
        }
    }

    public com.ctse.payment.dto.TicketResponse issueTicket(String bookingId, String ticketEmail, String guestName) {
        String url = bookingServiceBaseUrl + "/booking/" + bookingId + "/ticket";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        applyAdminAuth(headers);

        TicketIssueRequest body = new TicketIssueRequest(ticketEmail, guestName);
        HttpEntity<TicketIssueRequest> request = new HttpEntity<>(body, headers);

        try {
            return restTemplate.postForObject(url, request, com.ctse.payment.dto.TicketResponse.class);
        } catch (Exception ex) {
            log.error("Failed to issue ticket for bookingId={} : {}", bookingId, ex.getMessage());
            throw ex;
        }
    }

    @lombok.Data
    public static class TicketIssueRequest {
        private final String ticketEmail;
        private final String guestName;
    }
}

