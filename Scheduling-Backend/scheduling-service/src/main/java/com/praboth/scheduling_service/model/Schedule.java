package com.praboth.scheduling_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.*;
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
    @Pattern(regexp = "Hall-[A-Z]", message = "Hall ID must match pattern Hall-A, Hall-B, etc.")
    private String hallId;

    @NotNull(message = "Date is required")
    @FutureOrPresent(message = "Date must be today or in the future")
    private LocalDate date;

    @NotNull(message = "Start time is required")
    private LocalTime time;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    @DecimalMax(value = "10000.0", message = "Price must not exceed 10000")
    private double price;

    @Min(value = 1, message = "Available seats must be at least 1")
    @Max(value = 10000, message = "Available seats must not exceed 10000")
    private int availableSeats;

    @Pattern(
        regexp = "ACTIVE|CANCELLED",
        message = "Status must be one of: ACTIVE, CANCELLED"
    )
    @Builder.Default
    private String status = "ACTIVE";

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
