package com.ctse.payment.gateway;

import com.ctse.payment.model.Payment;
import com.ctse.payment.model.PaymentStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class MockPaymentGatewayClient implements PaymentGatewayClient {

    private static final Logger log = LoggerFactory.getLogger(MockPaymentGatewayClient.class);

    @Override
    public Payment charge(Payment payment) {
        log.info("Mock charging payment for bookingId={} amount={}", payment.getBookingId(), payment.getAmount());
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setTransactionReference("MOCK-TXN-" + UUID.randomUUID());
        payment.setGateway("MOCK");
        return payment;
    }

    @Override
    public Payment refund(Payment payment) {
        log.info("Mock refund for bookingId={} paymentId={}", payment.getBookingId(), payment.getId());
        payment.setStatus(PaymentStatus.REFUNDED);
        payment.setRefunded(true);
        payment.setRefundId("MOCK-REF-" + UUID.randomUUID());
        return payment;
    }
}
