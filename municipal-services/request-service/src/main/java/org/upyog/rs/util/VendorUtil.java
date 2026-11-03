package org.upyog.rs.util;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import org.springframework.beans.factory.annotation.Value;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class VendorUtil {
    private final RestTemplate restTemplate;

    @Value("${egov.vendor.host}")
    private String vendorHost;

    @Value("${egov.vendor.search.endpoint}")
    private String vendorSearchEndpoint;

    public VendorUtil(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Object searchVendor(RequestInfo requestInfo, String tenantId, List<String> vendorIds, String vendorName) {
        StringBuilder url = new StringBuilder(vendorHost).append(vendorSearchEndpoint);
        url.append("?tenantId=").append(tenantId);

        if (vendorIds != null && !vendorIds.isEmpty()) {
            url.append("&ids=").append(String.join(",", vendorIds));
        }
        if (vendorName != null) {
            url.append("&name=").append(vendorName);
        }

        // Wrap RequestInfo in the expected payload structure
        Map<String, Object> request = new HashMap<>();
        request.put("RequestInfo", requestInfo);

        try {
            ResponseEntity<Object> response = restTemplate.postForEntity(url.toString(), request, Object.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Error while fetching Vendor details", e);
            throw new RuntimeException("Failed to fetch vendor details", e);
        }
    }

    public Object searchVendorByOwnerId(RequestInfo requestInfo, String tenantId, String ownerId) {
        StringBuilder url = new StringBuilder(vendorHost).append(vendorSearchEndpoint);
        url.append("?tenantId=").append(tenantId);

        if (ownerId != null && !ownerId.trim().isEmpty()) {
            url.append("&ownerIds=").append(ownerId.trim());
        }

        Map<String, Object> request = new HashMap<>();
        request.put("RequestInfo", requestInfo);

        try {
            ResponseEntity<Object> response = restTemplate.postForEntity(url.toString(), request, Object.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Error while fetching Vendor details for ownerId: {}", ownerId, e);
            return null;
        }
    }
}
