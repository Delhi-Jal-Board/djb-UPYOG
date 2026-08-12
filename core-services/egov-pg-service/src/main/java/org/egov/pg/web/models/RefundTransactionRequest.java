package org.egov.pg.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.egov.common.contract.request.RequestInfo;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString
public class RefundTransactionRequest {

    @JsonProperty("RequestInfo")
    @NotNull
    @Valid
    private RequestInfo requestInfo;

    @JsonProperty("RefundRequest")
    @NotNull
    @Valid
    private RefundRequest refundRequest;

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    @ToString
    public static class RefundRequest {
        @JsonProperty("tenantId")
        @NotNull
        @Size(min = 2, max = 50)
        private String tenantId;

        @JsonProperty("txnId")
        private String txnId;

        @JsonProperty("consumerCode")
        private String consumerCode;
        
        @JsonProperty("module")
        private String module;
    }
}
