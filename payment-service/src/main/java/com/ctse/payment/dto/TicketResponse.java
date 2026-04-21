package com.ctse.payment.dto;

import lombok.Data;

import java.util.List;

@Data
public class TicketResponse {
    private String ticketCode;
    private String showId;
    private List<String> seats;
    private String guestName;
}
