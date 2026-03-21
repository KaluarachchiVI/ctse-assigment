package com.praboth.movie_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "movies")
public class Movie {

    @Id
    private String id;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private String genre;
    private String language;
    private String director;
    private List<String> cast;
    private int duration; // in minutes
    private LocalDate releaseDate;
    private double rating;
    private String posterUrl;
    
    @Builder.Default
    private String status = "NOW_SHOWING"; // NOW_SHOWING, COMING_SOON, ENDED

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
