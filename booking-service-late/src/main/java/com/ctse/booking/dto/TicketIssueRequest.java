package com.ctse.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketIssueRequest {

    private String ticketEmail;
    private String guestName;
}
