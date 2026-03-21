package com.praboth.scheduling_service.repository;

import com.praboth.scheduling_service.model.Seat;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SeatRepository extends MongoRepository<Seat, String> {

    List<Seat> findByScheduleId(String scheduleId);

    List<Seat> findByScheduleIdAndAvailable(String scheduleId, boolean available);

    Optional<Seat> findByScheduleIdAndSeatNumberAndAvailable(String scheduleId, String seatNumber, boolean available);

    List<Seat> findByScheduleIdAndSeatNumberIn(String scheduleId, List<String> seatNumbers);
}