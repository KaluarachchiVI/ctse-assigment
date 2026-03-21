package com.praboth.scheduling_service.service;

import com.praboth.scheduling_service.model.Schedule;
import com.praboth.scheduling_service.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;

    public List<Schedule> getAllSchedules() {
        return scheduleRepository.findAll();
    }

    public Optional<Schedule> getScheduleById(String id) {
        return scheduleRepository.findById(id);
    }

    public List<Schedule> getSchedulesByMovie(String movieId) {
        return scheduleRepository.findByMovieId(movieId);
    }

    public List<Schedule> getSchedulesByDate(LocalDate date) {
        return scheduleRepository.findByDate(date);
    }

    public List<Schedule> getSchedulesByMovieAndDate(String movieId, LocalDate date) {
        return scheduleRepository.findByMovieIdAndDate(movieId, date);
    }

    public Schedule createSchedule(Schedule schedule) {
        return scheduleRepository.save(schedule);
    }

    public Schedule updateSchedule(String id, Schedule updatedSchedule) {
        return scheduleRepository.findById(id)
                .map(existingSchedule -> {
                    existingSchedule.setMovieId(updatedSchedule.getMovieId());
                    existingSchedule.setHallId(updatedSchedule.getHallId());
                    existingSchedule.setDate(updatedSchedule.getDate());
                    existingSchedule.setTime(updatedSchedule.getTime());
                    existingSchedule.setPrice(updatedSchedule.getPrice());
                    existingSchedule.setAvailableSeats(updatedSchedule.getAvailableSeats());
                    existingSchedule.setStatus(updatedSchedule.getStatus());
                    return scheduleRepository.save(existingSchedule);
                })
                .orElseThrow(() -> new RuntimeException("Schedule not found with id: " + id));
    }

    public void deleteSchedule(String id) {
        scheduleRepository.deleteById(id);
    }
}
