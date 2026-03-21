package com.yuvidu.booking_service.controller;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.yuvidu.booking_service.service.BookingService;
import com.yuvidu.booking_service.model.Bookingmodel;


@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/booking")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public Bookingmodel createBooking(@RequestBody Bookingmodel booking) {
        return bookingService.createBooking(booking);
    }

    @GetMapping
    public List<Bookingmodel> getBookings() {
        return bookingService.getAllBookings();
    }

    @GetMapping("/{id}")
    public Bookingmodel getBooking(@PathVariable("id") String id) {
        return bookingService.getBookingById(id);
    }

     // Get bookings by user
    @GetMapping("/user/{userId}")
    public List<Bookingmodel> getUserBookings(@PathVariable("userId") String userId) {
        return bookingService.getBookingsByUser(userId);
    }

    @PutMapping("/{id}/status")
    public Bookingmodel updateBookingStatus(@PathVariable("id") String id, @RequestParam("status") String status) {
        return bookingService.updateBookingStatus(id, status);
    }

    @PutMapping("/{id}/cancel")
    public Bookingmodel cancelBooking(@PathVariable("id") String id) {
        return bookingService.cancelBooking(id);
    }

}
