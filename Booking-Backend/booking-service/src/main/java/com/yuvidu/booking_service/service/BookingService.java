package com.yuvidu.booking_service.service;

import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import com.yuvidu.booking_service.repository.BookingRepository;
import com.yuvidu.booking_service.model.Bookingmodel;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;

    public BookingService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    public Bookingmodel createBooking(Bookingmodel booking) {
        // add seat availability check
        // if seat is not available, throw exception
        // if seat is available, create booking
        // validate user exists
        booking.setStatus("PENDING");
        booking.setCreatedAt(LocalDateTime.now());
        return bookingRepository.save(booking);
    }

    public Bookingmodel getBookingById(String id) {
        System.out.println("Processing getBookingById for ID: [" + id + "] Length: " + (id != null ? id.length() : 0));
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found for that id: " + id));
    }

    public List<Bookingmodel> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Bookingmodel updateBookingStatus(String id, String status) {
        Bookingmodel booking = getBookingById(id);
        booking.setStatus(status);
        return bookingRepository.save(booking);
    }

    public Bookingmodel cancelBooking(String id) {
        Bookingmodel booking = getBookingById(id);
        booking.setStatus("CANCELLED");
        return bookingRepository.save(booking);
    }

    public List<Bookingmodel> getBookingsByUser(String userId) {
        return bookingRepository.findByUserId(userId);
    }

}
