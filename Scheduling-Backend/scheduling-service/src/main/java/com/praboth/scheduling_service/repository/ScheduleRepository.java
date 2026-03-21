package com.praboth.scheduling_service.repository;

import com.praboth.scheduling_service.model.Schedule;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduleRepository extends MongoRepository<Schedule, String> {
    List<Schedule> findByMovieId(String movieId);
    List<Schedule> findByDate(LocalDate date);
    List<Schedule> findByMovieIdAndDate(String movieId, LocalDate date);
    List<Schedule> findByHallId(String hallId);
}
