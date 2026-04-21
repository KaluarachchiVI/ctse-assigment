package com.ctse.booking.repository;

import com.ctse.booking.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface BookingRepository extends MongoRepository<Booking, String> {

    List<Booking> findByShowId(String showId);

    List<Booking> findByShowIdAndStatusIn(String showId, Iterable<String> statuses);

    List<Booking> findByUserId(String userId);
}
