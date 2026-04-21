package com.ctse.payment.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StripeCheckoutSessionResponse {
    private String sessionId;
    private String checkoutUrl;
}
