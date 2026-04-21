package com.ctse.payment.service;

import java.util.List;

public interface EmailService {
    void sendTicketEmail(
            String to,
            String ticketCode,
            String showId,
            List<String> seats,
            String guestName
    );
}
