package com.ctse.booking.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "bookings")
public class Booking {

    @Id
    private String id;

    private String userId;
    private String showId;
    @Builder.Default
    private List<String> seats = new ArrayList<>();
    private String paymentId;
    private String status;
    private String ticketEmail;
    private String guestName;
    private String ticketCode;
    private Instant createdAt;
}
