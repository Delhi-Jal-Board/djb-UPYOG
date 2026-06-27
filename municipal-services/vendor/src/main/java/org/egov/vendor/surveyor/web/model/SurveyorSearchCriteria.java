package org.egov.vendor.surveyor.web.model;

import java.util.List;

import org.springframework.util.CollectionUtils;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SurveyorSearchCriteria {

    @JsonProperty("offset")
    private Integer offset;

    @JsonProperty("limit")
    private Integer limit;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("mobileNumber")
    private String mobileNumber;

    @JsonProperty("supervisorId")
    private String supervisorId;


    @JsonProperty("ownerIds")
    private List<String> ownerIds;

    @JsonProperty("ids")
    private List<String> ids;

    @JsonProperty("vendorId")
    private String vendorId;

    @JsonProperty("status")
    private List<String> status;

    @JsonProperty("name")
    private String name;

    @JsonProperty("vendorName")
    private String vendorName;

    @JsonProperty("sortBy")
    private SortBy sortBy;

    @JsonProperty("sortOrder")
    private SortOrder sortOrder;

    public enum SortOrder {
        ASC, DESC
    }

    public enum SortBy {
        tenantId, mobileNumber, ownerIds, ids, status, createdTime
    }

    public boolean isEmpty() {
        return (this.tenantId == null && this.offset == null && this.limit == null
                && this.mobileNumber == null && this.supervisorId == null && this.ownerIds == null
                && this.name == null && this.vendorName == null
                && CollectionUtils.isEmpty(this.ids)
                && CollectionUtils.isEmpty(this.status)
                && this.vendorId == null);
    }

    public boolean tenantIdOnly() {
        return (this.tenantId != null && this.mobileNumber == null
                && this.ownerIds == null && CollectionUtils.isEmpty(this.ids)
                && CollectionUtils.isEmpty(this.status) && this.vendorId == null);
    }
}