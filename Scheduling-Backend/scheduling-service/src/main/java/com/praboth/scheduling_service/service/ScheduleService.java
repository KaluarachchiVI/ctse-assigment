package com.praboth.scheduling_service.service;

import com.praboth.scheduling_service.model.Schedule;
import com.praboth.scheduling_service.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final SeatService seatService;

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
        sanitize(schedule);
        validateTimeOrder(schedule);
        checkForOverlap(schedule, null);

        Schedule savedSchedule = scheduleRepository.save(schedule);
        seatService.initializeSeats(savedSchedule.getId(), savedSchedule.getAvailableSeats());
        return savedSchedule;
    }

    public Schedule updateSchedule(String id, Schedule updatedSchedule) {
        sanitize(updatedSchedule);
        validateTimeOrder(updatedSchedule);
        checkForOverlap(updatedSchedule, id); // exclude self from collision check

        return scheduleRepository.findById(id)
                .map(existingSchedule -> {
                    existingSchedule.setMovieId(updatedSchedule.getMovieId());
                    existingSchedule.setHallId(updatedSchedule.getHallId());
                    existingSchedule.setDate(updatedSchedule.getDate());
                    existingSchedule.setTime(updatedSchedule.getTime());
                    existingSchedule.setEndTime(updatedSchedule.getEndTime());
                    existingSchedule.setPrice(updatedSchedule.getPrice());
                    existingSchedule.setAvailableSeats(updatedSchedule.getAvailableSeats());
                    existingSchedule.setStatus(updatedSchedule.getStatus());
                    return scheduleRepository.save(existingSchedule);
                })
                .orElseThrow(() -> new RuntimeException("Schedule not found with id: " + id));
    }

    public void deleteSchedule(String id) {
        if (!scheduleRepository.existsById(id)) {
            throw new RuntimeException("Schedule not found with id: " + id);
        }
        scheduleRepository.deleteById(id);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Validates that endTime is strictly after time (startTime).
     */
    private void validateTimeOrder(Schedule schedule) {
        if (schedule.getTime() != null && schedule.getEndTime() != null) {
            if (!schedule.getEndTime().isAfter(schedule.getTime())) {
                throw new IllegalArgumentException(
                    "End time must be after start time. Got start=" + schedule.getTime()
                    + " end=" + schedule.getEndTime());
            }
        }
    }

    /**
     * Checks that no existing ACTIVE schedule in the same hall on the same date
     * overlaps with [schedule.time, schedule.endTime).
     *
     * Two intervals [a, b) and [c, d) overlap iff a < d && c < b.
     *
     * @param excludeId schedule ID to exclude from the check (used for updates; null for creates)
     */
    private void checkForOverlap(Schedule schedule, String excludeId) {
        if (schedule.getHallId() == null || schedule.getDate() == null
                || schedule.getTime() == null || schedule.getEndTime() == null) {
            return; // Bean validation will handle missing fields
        }

        List<Schedule> existing = scheduleRepository
                .findByHallIdAndDate(schedule.getHallId(), schedule.getDate());

        LocalTime newStart = schedule.getTime();
        LocalTime newEnd   = schedule.getEndTime();

        for (Schedule s : existing) {
            // Skip self (for update operations) and cancelled schedules
            if ("CANCELLED".equals(s.getStatus())) continue;
            if (excludeId != null && excludeId.equals(s.getId())) continue;
            if (s.getTime() == null || s.getEndTime() == null) continue;

            LocalTime existStart = s.getTime();
            LocalTime existEnd   = s.getEndTime();

            // Overlap condition: newStart < existEnd AND existStart < newEnd
            if (newStart.isBefore(existEnd) && existStart.isBefore(newEnd)) {
                throw new ScheduleConflictException(
                    "Hall " + schedule.getHallId() + " is already booked from "
                    + existStart + " to " + existEnd + " on " + schedule.getDate()
                    + ". Cannot schedule " + newStart + "–" + newEnd + ".");
            }
        }
    }

    private void sanitize(Schedule schedule) {
        if (schedule.getHallId() != null) schedule.setHallId(schedule.getHallId().trim());
        if (schedule.getMovieId() != null) schedule.setMovieId(schedule.getMovieId().trim());
        if (schedule.getStatus() != null) schedule.setStatus(schedule.getStatus().trim().toUpperCase());
    }
}
