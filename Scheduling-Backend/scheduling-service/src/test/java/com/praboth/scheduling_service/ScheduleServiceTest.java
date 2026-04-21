package com.praboth.scheduling_service;

import com.praboth.scheduling_service.model.Schedule;
import com.praboth.scheduling_service.repository.ScheduleRepository;
import com.praboth.scheduling_service.service.ScheduleConflictException;
import com.praboth.scheduling_service.service.ScheduleService;
import com.praboth.scheduling_service.service.SeatService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScheduleServiceTest {

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private SeatService seatService;

    @InjectMocks
    private ScheduleService scheduleService;

    private static final LocalDate TODAY = LocalDate.now().plusDays(1);
    private static final String HALL_A = "Hall-A";

    private Schedule buildSchedule(String id, LocalTime start, LocalTime end) {
        return Schedule.builder()
                .id(id)
                .movieId("movie1")
                .hallId(HALL_A)
                .date(TODAY)
                .time(start)
                .endTime(end)
                .price(12.50)
                .availableSeats(100)
                .status("ACTIVE")
                .build();
    }

    // ── createSchedule — happy path ────────────────────────────────────────

    @Test
    @DisplayName("createSchedule saves and initialises seats when no overlap")
    void createSchedule_noOverlap_savesAndInitSeats() {
        Schedule s = buildSchedule(null, LocalTime.of(10, 0), LocalTime.of(12, 0));
        Schedule saved = buildSchedule("s1", LocalTime.of(10, 0), LocalTime.of(12, 0));

        when(scheduleRepository.findByHallIdAndDate(HALL_A, TODAY)).thenReturn(List.of());
        when(scheduleRepository.save(s)).thenReturn(saved);

        Schedule result = scheduleService.createSchedule(s);

        assertThat(result.getId()).isEqualTo("s1");
        verify(seatService).initializeSeats("s1", 100);
    }

    // ── createSchedule — overlap detection ───────────────────────────────

    @Test
    @DisplayName("createSchedule throws ScheduleConflictException when intervals overlap")
    void createSchedule_overlap_throwsConflict() {
        Schedule existing = buildSchedule("e1", LocalTime.of(10, 0), LocalTime.of(12, 0));
        Schedule newSched = buildSchedule(null, LocalTime.of(11, 0), LocalTime.of(13, 0));

        when(scheduleRepository.findByHallIdAndDate(HALL_A, TODAY)).thenReturn(List.of(existing));

        assertThatThrownBy(() -> scheduleService.createSchedule(newSched))
                .isInstanceOf(ScheduleConflictException.class)
                .hasMessageContaining(HALL_A);

        verify(scheduleRepository, never()).save(any());
    }

    @Test
    @DisplayName("createSchedule allows adjacent (non-overlapping) schedules")
    void createSchedule_adjacent_noConflict() {
        // Existing: 10:00–12:00, new: 12:00–14:00 — adjacent, not overlapping
        Schedule existing = buildSchedule("e1", LocalTime.of(10, 0), LocalTime.of(12, 0));
        Schedule newSched = buildSchedule(null, LocalTime.of(12, 0), LocalTime.of(14, 0));
        Schedule saved = buildSchedule("s2", LocalTime.of(12, 0), LocalTime.of(14, 0));

        when(scheduleRepository.findByHallIdAndDate(HALL_A, TODAY)).thenReturn(List.of(existing));
        when(scheduleRepository.save(newSched)).thenReturn(saved);

        // Should NOT throw
        assertThatCode(() -> scheduleService.createSchedule(newSched)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("createSchedule ignores CANCELLED schedules during overlap check")
    void createSchedule_cancelledIgnored() {
        Schedule cancelled = buildSchedule("e1", LocalTime.of(10, 0), LocalTime.of(12, 0));
        cancelled.setStatus("CANCELLED");

        Schedule newSched = buildSchedule(null, LocalTime.of(10, 30), LocalTime.of(11, 30));
        Schedule saved = buildSchedule("s3", LocalTime.of(10, 30), LocalTime.of(11, 30));

        when(scheduleRepository.findByHallIdAndDate(HALL_A, TODAY)).thenReturn(List.of(cancelled));
        when(scheduleRepository.save(newSched)).thenReturn(saved);

        assertThatCode(() -> scheduleService.createSchedule(newSched)).doesNotThrowAnyException();
    }

    // ── endTime validation ─────────────────────────────────────────────────

    @Test
    @DisplayName("createSchedule throws IllegalArgumentException when endTime is before startTime")
    void createSchedule_endBeforeStart_throws() {
        Schedule bad = buildSchedule(null, LocalTime.of(14, 0), LocalTime.of(12, 0));

        assertThatThrownBy(() -> scheduleService.createSchedule(bad))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("End time must be after start time");
    }

    @Test
    @DisplayName("createSchedule throws when endTime equals startTime")
    void createSchedule_endEqualsStart_throws() {
        Schedule bad = buildSchedule(null, LocalTime.of(14, 0), LocalTime.of(14, 0));

        assertThatThrownBy(() -> scheduleService.createSchedule(bad))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ── updateSchedule — self-exclusion ────────────────────────────────────

    @Test
    @DisplayName("updateSchedule excludes itself from overlap check (same slot update OK)")
    void updateSchedule_selfExclusion_noConflict() {
        Schedule existingInDb = buildSchedule("s1", LocalTime.of(10, 0), LocalTime.of(12, 0));
        Schedule updatePayload = buildSchedule(null, LocalTime.of(10, 0), LocalTime.of(12, 30));

        // The repository finds "s1" in the hall's schedule, but it should be excluded
        when(scheduleRepository.findByHallIdAndDate(HALL_A, TODAY)).thenReturn(List.of(existingInDb));
        when(scheduleRepository.findById("s1")).thenReturn(Optional.of(existingInDb));
        when(scheduleRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        assertThatCode(() -> scheduleService.updateSchedule("s1", updatePayload))
                .doesNotThrowAnyException();
    }

    // ── deleteSchedule ─────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteSchedule calls repository when schedule exists")
    void deleteSchedule_success() {
        when(scheduleRepository.existsById("s1")).thenReturn(true);

        scheduleService.deleteSchedule("s1");

        verify(scheduleRepository).deleteById("s1");
    }

    @Test
    @DisplayName("deleteSchedule throws when schedule does not exist")
    void deleteSchedule_notFound() {
        when(scheduleRepository.existsById("missing")).thenReturn(false);

        assertThatThrownBy(() -> scheduleService.deleteSchedule("missing"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }
}
