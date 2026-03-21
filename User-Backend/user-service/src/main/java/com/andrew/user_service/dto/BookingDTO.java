package com.andrew.user_service.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class BookingDTO {
    private String id;
    private String userId;
    private String showId;
    private List<String> seats;
    private String status;
    private String paymentId;
    private LocalDateTime createdAt;
}
