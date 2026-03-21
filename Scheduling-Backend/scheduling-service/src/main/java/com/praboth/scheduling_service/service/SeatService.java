package com.praboth.scheduling_service.service;

import com.praboth.scheduling_service.model.Seat;
import com.praboth.scheduling_service.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SeatService {

    private final SeatRepository seatRepository;

    // 1️⃣ Initialize seats for a schedule
    public void initializeSeats(String scheduleId, int totalSeats) {
        List<Seat> seats = new ArrayList<>();
        for (int i = 1; i <= totalSeats; i++) {
            Seat seat = Seat.builder()
                    .scheduleId(scheduleId)
                    .seatNumber("A" + i)
                    .available(true)
                    .build();
            seats.add(seat);
        }
        seatRepository.saveAll(seats);
    }

    // 2️⃣ Get all seats for a schedule
    public List<Seat> getSeats(String scheduleId) {
        return seatRepository.findByScheduleId(scheduleId);
    }

    // 3️⃣ Get only available seats
    public List<Seat> getAvailableSeats(String scheduleId) {
        return seatRepository.findByScheduleIdAndAvailable(scheduleId, true);
    }

    // 4️⃣ Book a seat
    public boolean bookSeat(String scheduleId, String seatNumber) {
        Optional<Seat> seatOpt = seatRepository.findByScheduleIdAndSeatNumberAndAvailable(scheduleId, seatNumber, true);
        if (seatOpt.isEmpty())
            return false; // seat already booked

        Seat seat = seatOpt.get();
        seat.setAvailable(false);
        seatRepository.save(seat);
        return true;
    }
}