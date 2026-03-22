package com.praboth.movie_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "movies")
public class Movie {

    @Id
    private String id;

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;

    @Size(max = 200, message = "Genre must not exceed 200 characters")
    private String genre;

    @Size(max = 50, message = "Language must not exceed 50 characters")
    private String language;

    @Size(max = 200, message = "Director must not exceed 200 characters")
    private String director;

    private List<String> cast;

    @Min(value = 1, message = "Duration must be at least 1 minute")
    @Max(value = 600, message = "Duration must not exceed 600 minutes")
    private int duration; // in minutes

    private LocalDate releaseDate;

    @DecimalMin(value = "0.0", message = "Rating must be at least 0.0")
    @DecimalMax(value = "10.0", message = "Rating must not exceed 10.0")
    private double rating;

    private String posterUrl;
    private String backdropUrl;

    // Detailed cast: [{"name": "...", "character": "...", "profilePath": "..."}]
    private List<Map<String, String>> castDetails;

    private List<String> additionalImages;
    private String tmdbId;

    @Pattern(
        regexp = "NOW_SHOWING|COMING_SOON|ENDED",
        message = "Status must be one of: NOW_SHOWING, COMING_SOON, ENDED"
    )
    @Builder.Default
    private String status = "NOW_SHOWING";

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
