package com.ctse.payment.gateway;

import com.ctse.payment.model.Payment;

public interface PaymentGatewayClient {

    Payment charge(Payment payment);

    Payment refund(Payment payment);
}
