package com.ctse.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    private String id;
    private String userId;
    private String showId;
    private List<String> seats;
    private String paymentId;
    private String status;
    private String ticketEmail;
    private String guestName;
    private String ticketCode;
    private Instant createdAt;
}
