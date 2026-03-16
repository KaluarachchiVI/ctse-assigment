package com.yuvidu.booking_service.controller;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.yuvidu.booking_service.service.BookingService;
import com.yuvidu.booking_service.model.Bookingmodel;



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

    @GetMapping("/{id}")
    public Bookingmodel getBooking(@PathVariable String id) {
        return bookingService.getBookingById(id);
    }

     // Get bookings by user
    @GetMapping("/user/{userId}")
    public List<Bookingmodel> getUserBookings(@PathVariable String userId) {
        return bookingService.getBookingsByUser(userId);
    }
    
    @GetMapping
    public List<Bookingmodel> getBookings() {
        return bookingService.getAllBookings();
    }

    @PutMapping("/{id}/status")
    public Bookingmodel updateBookingStatus(@PathVariable String id, @RequestParam String status) {
        return bookingService.updateBookingStatus(id, status);
    }

    @PutMapping("/{id}/cancel")
    public String cancelBooking(@PathVariable String id) {
        bookingService.cancelBooking(id);
        return "Booking cancelled successfully";
    }

}
