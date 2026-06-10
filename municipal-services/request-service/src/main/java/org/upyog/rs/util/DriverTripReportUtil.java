package org.upyog.rs.util;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class DriverTripReportUtil {

    private final RestTemplate restTemplate;

    @Value("${egov.driver.trip.report.host}")
    private String tripReportHost;

    @Value("${egov.driver.trip.report.search.endpoint}")
    private String tripReportSearchEndpoint;

    public DriverTripReportUtil(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Object searchTripReport(RequestInfo requestInfo, String tenantId, String bookingNo) {
        StringBuilder url = new StringBuilder(tripReportHost)
                .append(tripReportSearchEndpoint)
                .append("?tenantId=").append(tenantId)
                .append("&offset=0&limit=50")
                .append("&bookingNo=").append(bookingNo);

        Map<String, Object> request = new HashMap<>();
        request.put("RequestInfo", requestInfo);

        try {
            ResponseEntity<Object> response = restTemplate.postForEntity(url.toString(), request, Object.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Error while fetching driver trip report for bookingNo: {}", bookingNo, e);
            return null; // Don't break the main search if trip report fails
        }
    }
}