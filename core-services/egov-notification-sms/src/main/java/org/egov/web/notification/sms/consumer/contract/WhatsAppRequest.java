package org.egov.web.notification.sms.consumer.contract;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.Map;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString
public class WhatsAppRequest {
    private String mobileNumber;
    private String templateName;
    private List<String> parameters;
}
