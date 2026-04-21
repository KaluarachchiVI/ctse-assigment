package com.ctse.booking.service;

import com.ctse.booking.dto.BookingResponse;
import com.ctse.booking.dto.CreateBookingRequest;
import com.ctse.booking.dto.TicketIssueRequest;
import com.ctse.booking.dto.TicketResponse;
import com.ctse.booking.model.Booking;
import com.ctse.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingBusinessService {

    private static final Set<String> BLOCKING_STATUSES = Set.of("PENDING", "CONFIRMED");

    private final BookingRepository bookingRepository;

    public BookingResponse create(CreateBookingRequest req) {
        boolean guest = req.getUserId() == null || req.getUserId().isBlank();
        if (guest && (req.getGuestName() == null || req.getGuestName().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "guestName is required when userId is absent");
        }

        List<String> normalizedSeats = req.getSeats().stream()
                .map(s -> s.toUpperCase(Locale.ROOT).trim())
                .toList();

        assertSeatsAvailable(req.getShowId(), normalizedSeats);

        Booking booking = Booking.builder()
                .userId(guest ? null : req.getUserId().trim())
                .showId(req.getShowId().trim())
                .seats(new ArrayList<>(normalizedSeats))
                .paymentId(req.getPaymentId())
                .status(req.getStatus() != null ? req.getStatus().trim().toUpperCase(Locale.ROOT) : "PENDING")
                .ticketEmail(req.getTicketEmail().trim())
                .guestName(req.getGuestName() != null ? req.getGuestName().trim() : null)
                .createdAt(Instant.now())
                .build();

        booking = bookingRepository.save(booking);
        return toResponse(booking);
    }

    public List<String> confirmedSeatIds(String showId) {
        List<Booking> bookings = bookingRepository.findByShowIdAndStatusIn(
                showId,
                List.copyOf(BLOCKING_STATUSES)
        );
        return bookings.stream()
                .flatMap(b -> b.getSeats() != null ? b.getSeats().stream() : java.util.stream.Stream.empty())
                .map(s -> s.toUpperCase(Locale.ROOT).trim())
                .distinct()
                .sorted()
                .toList();
    }

    public List<BookingResponse> listAll() {
        return bookingRepository.findAll().stream()
                .sorted(Comparator.comparing(Booking::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(this::toResponse)
                .toList();
    }

    public List<BookingResponse> listByUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            return List.of();
        }
        return bookingRepository.findByUserId(userId.trim()).stream()
                .sorted(Comparator.comparing(Booking::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(this::toResponse)
                .toList();
    }

    public void updateStatus(String bookingId, String newStatus) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        b.setStatus(normalizeStatus(newStatus));
        bookingRepository.save(b);
    }

    public TicketResponse issueTicket(String bookingId, TicketIssueRequest req) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        if (!"CONFIRMED".equalsIgnoreCase(b.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking must be CONFIRMED to issue ticket");
        }
        String code = b.getTicketCode();
        if (code == null || code.isBlank()) {
            code = "TKT-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
            b.setTicketCode(code);
        }
        if (req.getTicketEmail() != null && !req.getTicketEmail().isBlank()) {
            b.setTicketEmail(req.getTicketEmail().trim());
        }
        if (req.getGuestName() != null && !req.getGuestName().isBlank()) {
            b.setGuestName(req.getGuestName().trim());
        }
        bookingRepository.save(b);
        return TicketResponse.builder()
                .ticketCode(b.getTicketCode())
                .showId(b.getShowId())
                .seats(b.getSeats())
                .guestName(b.getGuestName())
                .build();
    }

    private void assertSeatsAvailable(String showId, List<String> wanted) {
        Set<String> taken = bookingRepository.findByShowIdAndStatusIn(showId, List.copyOf(BLOCKING_STATUSES))
                .stream()
                .flatMap(b -> b.getSeats() != null ? b.getSeats().stream() : java.util.stream.Stream.empty())
                .map(s -> s.toUpperCase(Locale.ROOT).trim())
                .collect(Collectors.toSet());
        for (String seat : wanted) {
            if (taken.contains(seat)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Seat already held: " + seat);
            }
        }
    }

    private static String normalizeStatus(String s) {
        if (s == null || s.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status required");
        }
        return s.trim().toUpperCase(Locale.ROOT);
    }

    private BookingResponse toResponse(Booking b) {
        return BookingResponse.builder()
                .id(b.getId())
                .userId(b.getUserId())
                .showId(b.getShowId())
                .seats(b.getSeats())
                .paymentId(b.getPaymentId())
                .status(b.getStatus())
                .ticketEmail(b.getTicketEmail())
                .guestName(b.getGuestName())
                .ticketCode(b.getTicketCode())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
