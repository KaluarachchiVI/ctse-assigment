package com.praboth.scheduling_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "schedules")
public class Schedule {

    @Id
    private String id;

    @NotBlank(message = "Movie ID is required")
    private String movieId;

    @NotBlank(message = "Hall ID is required")
    private String hallId;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotNull(message = "Time is required")
    private LocalTime time;

    private double price;
    private int availableSeats;
    
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, CANCELLED

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
