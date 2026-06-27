package org.egov.vendor.supervisor.web.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.util.CollectionUtils;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class SupervisorSearchCriteria {

    @JsonProperty("offset")
    private Integer offset;

    @JsonProperty("limit")
    private Integer limit;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("ids")
    private List<String> ids;

    @JsonProperty("vendorId")
    private String vendorId;

    @JsonProperty("mobileNumber")
    private String mobileNumber;

    @JsonProperty("ownerIds")
    private List<String> ownerIds;

    @JsonProperty("name")
    private List<String> name;

    @JsonProperty("status")
    private List<String> status;

    @JsonProperty("assignedZoneId")
    private String assignedZoneId;

    @JsonProperty("vendorName")
    private String vendorName;

    public boolean isEmpty() {
        return (this.tenantId == null && this.offset == null && this.limit == null
                && this.mobileNumber == null && this.vendorId == null
                && this.vendorName == null
                && CollectionUtils.isEmpty(this.ownerIds)
                && CollectionUtils.isEmpty(this.name)
                && CollectionUtils.isEmpty(this.ids)
                && CollectionUtils.isEmpty(this.status));
    }
}