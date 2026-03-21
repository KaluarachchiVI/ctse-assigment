package com.praboth.scheduling_service.controller;

import com.praboth.scheduling_service.model.Seat;
import com.praboth.scheduling_service.service.SeatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/seats")
@RequiredArgsConstructor
public class SeatController {

    private final SeatService seatService;

    // Get all seats for a schedule
    @GetMapping("/schedule/{scheduleId}")
    public ResponseEntity<List<Seat>> getSeats(@PathVariable String scheduleId) {
        return ResponseEntity.ok(seatService.getSeats(scheduleId));
    }

    // Get only available seats for a schedule
    @GetMapping("/schedule/{scheduleId}/available")
    public ResponseEntity<List<Seat>> getAvailableSeats(@PathVariable String scheduleId) {
        return ResponseEntity.ok(seatService.getAvailableSeats(scheduleId));
    }

    // Book a specific seat
    @PostMapping("/book")
    public ResponseEntity<String> bookSeat(@RequestBody Map<String, String> request) {
        String scheduleId = request.get("scheduleId");
        String seatNumber = request.get("seatNumber");

        boolean success = seatService.bookSeat(scheduleId, seatNumber);
        if (success) {
            return ResponseEntity.ok("Seat booked successfully!");
        } else {
            return ResponseEntity.badRequest().body("Seat already booked or not found.");
        }
    }

    // Make multiple seats unavailable
    @PostMapping("/unavailable")
    public ResponseEntity<String> unavailableSeats(@RequestBody Map<String, Object> request) {
        String scheduleId = (String) request.get("scheduleId");
        List<String> seatNumbers = (List<String>) request.get("seatNumbers");

        seatService.unavailableSelectedSeats(scheduleId, seatNumbers);
        return ResponseEntity.ok("Selected seats marked as unavailable!");
    }
}
