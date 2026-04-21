package com.praboth.movie_service;

import com.praboth.movie_service.model.Movie;
import com.praboth.movie_service.repository.MovieRepository;
import com.praboth.movie_service.service.MovieService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MovieServiceTest {

    @Mock
    private MovieRepository movieRepository;

    @InjectMocks
    private MovieService movieService;

    private Movie sampleMovie;

    @BeforeEach
    void setUp() {
        sampleMovie = Movie.builder()
                .id("m1")
                .title("Inception")
                .genre("Sci-Fi")
                .language("EN")
                .duration(148)
                .rating(8.8)
                .status("NOW_SHOWING")
                .build();
    }

    // ── getAllMovies ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("getAllMovies returns all movies from repository")
    void getAllMovies_returnsAll() {
        when(movieRepository.findAll()).thenReturn(List.of(sampleMovie));

        List<Movie> result = movieService.getAllMovies();

        assertThat(result).hasSize(1).containsExactly(sampleMovie);
        verify(movieRepository).findAll();
    }

    // ── getMovieById ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("getMovieById returns movie when found")
    void getMovieById_found() {
        when(movieRepository.findById("m1")).thenReturn(Optional.of(sampleMovie));

        Optional<Movie> result = movieService.getMovieById("m1");

        assertThat(result).isPresent().contains(sampleMovie);
    }

    @Test
    @DisplayName("getMovieById returns empty when not found")
    void getMovieById_notFound() {
        when(movieRepository.findById("missing")).thenReturn(Optional.empty());

        Optional<Movie> result = movieService.getMovieById("missing");

        assertThat(result).isEmpty();
    }

    // ── createMovie ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("createMovie trims whitespace and saves")
    void createMovie_sanitizesAndSaves() {
        Movie toCreate = Movie.builder()
                .title("  Dune  ")
                .genre("  Sci-Fi  ")
                .language("  en  ")
                .duration(155)
                .rating(8.0)
                .status("now_showing")
                .build();
        Movie saved = Movie.builder().id("m2").title("Dune").genre("Sci-Fi")
                .language("en").duration(155).rating(8.0).status("NOW_SHOWING").build();

        when(movieRepository.save(any(Movie.class))).thenReturn(saved);

        Movie result = movieService.createMovie(toCreate);

        assertThat(result.getId()).isEqualTo("m2");
        // Verify sanitisation side-effects on the input object
        assertThat(toCreate.getTitle()).isEqualTo("Dune");
        assertThat(toCreate.getStatus()).isEqualTo("NOW_SHOWING");
        verify(movieRepository).save(toCreate);
    }

    // ── updateMovie ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateMovie updates all fields and saves")
    void updateMovie_success() {
        Movie update = Movie.builder()
                .title("Inception 2")
                .description("Sequel")
                .genre("Sci-Fi")
                .language("EN")
                .duration(160)
                .rating(9.0)
                .status("NOW_SHOWING")
                .build();

        when(movieRepository.findById("m1")).thenReturn(Optional.of(sampleMovie));
        when(movieRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Movie result = movieService.updateMovie("m1", update);

        assertThat(result.getTitle()).isEqualTo("Inception 2");
        assertThat(result.getDuration()).isEqualTo(160);
    }

    @Test
    @DisplayName("updateMovie throws when movie not found")
    void updateMovie_notFound() {
        when(movieRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> movieService.updateMovie("missing", sampleMovie))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }

    // ── deleteMovie ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteMovie calls repository when movie exists")
    void deleteMovie_success() {
        when(movieRepository.existsById("m1")).thenReturn(true);

        movieService.deleteMovie("m1");

        verify(movieRepository).deleteById("m1");
    }

    @Test
    @DisplayName("deleteMovie throws when movie does not exist")
    void deleteMovie_notFound() {
        when(movieRepository.existsById("missing")).thenReturn(false);

        assertThatThrownBy(() -> movieService.deleteMovie("missing"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }

    // ── searchMovies ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("searchMovies delegates to repository")
    void searchMovies_delegatesToRepository() {
        when(movieRepository.findByTitleContainingIgnoreCase("inc"))
                .thenReturn(List.of(sampleMovie));

        List<Movie> result = movieService.searchMovies("inc");

        assertThat(result).containsExactly(sampleMovie);
    }

    // ── getMoviesByStatus ─────────────────────────────────────────────────────

    @Test
    @DisplayName("getMoviesByStatus returns filtered list")
    void getMoviesByStatus() {
        when(movieRepository.findByStatus("NOW_SHOWING")).thenReturn(List.of(sampleMovie));

        List<Movie> result = movieService.getMoviesByStatus("NOW_SHOWING");

        assertThat(result).containsExactly(sampleMovie);
    }
}
