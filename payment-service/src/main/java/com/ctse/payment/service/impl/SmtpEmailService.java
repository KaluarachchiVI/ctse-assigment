package com.ctse.payment.service.impl;

import com.ctse.payment.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SmtpEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailService.class);

    private final JavaMailSender mailSender;

    @Value("${mail.from:no-reply@motionpictures.local}")
    private String mailFrom;

    @Override
    public void sendTicketEmail(
            String to,
            String ticketCode,
            String showId,
            List<String> seats,
            String guestName
    ) {
        if (to == null || to.isBlank()) {
            log.warn("Skipping ticket email: recipient email is empty");
            return;
        }
        if (ticketCode == null || ticketCode.isBlank()) {
            log.warn("Skipping ticket email: ticketCode is empty");
            return;
        }

        String seatText = seats == null ? "" : String.join(", ", seats);
        String nameText = (guestName == null || guestName.isBlank()) ? "" : guestName;

        String subject = "Your Motion Pictures Ticket: " + ticketCode;
        String body =
                "Hi " + nameText + "\n\n" +
                "Thanks for booking with Motion Pictures.\n\n" +
                "Ticket code: " + ticketCode + "\n" +
                "Show: " + showId + "\n" +
                "Seats: " + seatText + "\n\n" +
                "Use this code/QR at the theatre entrance.\n\n" +
                "— Motion Pictures";

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(mailFrom == null ? "no-reply@motionpictures.local" : mailFrom);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
        } catch (MessagingException ex) {
            log.error("Failed to compose/send ticket email due to messaging error: {}", ex.getMessage());
        } catch (Exception ex) {
            log.error("Failed to send ticket email: {}", ex.getMessage());
        }
    }
}
