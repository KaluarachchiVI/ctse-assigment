package com.ctse.booking.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CreateBookingRequest {

    private String userId;

    @NotBlank
    private String showId;

    @NotEmpty
    private List<@NotBlank String> seats;

    private String paymentId;

    @NotBlank
    private String status;

    @NotBlank
    @Email
    private String ticketEmail;

    private String guestName;
}
