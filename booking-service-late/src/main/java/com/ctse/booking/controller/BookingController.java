package com.ctse.booking.controller;

import com.ctse.booking.dto.BookingResponse;
import com.ctse.booking.dto.CreateBookingRequest;
import com.ctse.booking.dto.StatusUpdateRequest;
import com.ctse.booking.dto.TicketIssueRequest;
import com.ctse.booking.dto.TicketResponse;
import com.ctse.booking.service.BookingBusinessService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class BookingController {

    private final BookingBusinessService bookingService;

    @PostMapping("/booking")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse create(@Valid @RequestBody CreateBookingRequest request) {
        return bookingService.create(request);
    }

    /**
     * Public: seat availability (must stay under {@code /booking/public/**} — see SecurityConfig).
     * Legacy path {@code /booking/show/...} removed to avoid OAuth2 Bearer filter (401).
     */
    @GetMapping("/booking/public/show/{showId}/confirmed-seats")
    public List<String> confirmedSeats(@PathVariable("showId") String showId) {
        return bookingService.confirmedSeatIds(showId);
    }

    /**
     * Logged-in user: Bearer JWT from user-service (subject = user id). No admin Basic auth.
     */
    @GetMapping("/booking/me")
    public List<BookingResponse> listMine(Authentication authentication) {
        if (!(authentication instanceof JwtAuthenticationToken jwtAuth)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bearer token required");
        }
        Jwt jwt = jwtAuth.getToken();
        String sub = jwt.getSubject();
        if (sub == null || sub.isBlank()) {
            return List.of();
        }
        return bookingService.listByUserId(sub);
    }

    /** Admin: full list (HTTP Basic with BOOKING_ADMIN_*). */
    @GetMapping("/booking")
    public List<BookingResponse> list() {
        return bookingService.listAll();
    }

    /**
     * Admin UI: PUT with ?status=CONFIRMED
     */
    @PutMapping("/booking/{bookingId}/status")
    public ResponseEntity<Void> updateStatusQuery(
            @PathVariable("bookingId") String bookingId,
            @RequestParam String status
    ) {
        bookingService.updateStatus(bookingId, status);
        return ResponseEntity.noContent().build();
    }

    /**
     * Payment service: PUT with JSON body {"status":"CONFIRMED"}
     */
    @PutMapping("/bookings/{bookingId}/status")
    public ResponseEntity<Void> updateStatusBody(
            @PathVariable String bookingId,
            @RequestBody StatusUpdateRequest body
    ) {
        bookingService.updateStatus(bookingId, body != null ? body.getStatus() : null);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/booking/{bookingId}/ticket")
    public TicketResponse issueTicket(
            @PathVariable("bookingId") String bookingId,
            @RequestBody TicketIssueRequest body
    ) {
        return bookingService.issueTicket(bookingId, body != null ? body : new TicketIssueRequest());
    }
}
