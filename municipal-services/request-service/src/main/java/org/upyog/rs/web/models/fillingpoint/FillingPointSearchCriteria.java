package org.upyog.rs.web.models.fillingpoint;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class FillingPointSearchCriteria {

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("id")
    private String id;

    @JsonProperty("fillingPointName")
    private String fillingPointName;

    @JsonProperty("designation")
    private String designation;

    @JsonProperty("name")
    private String name;

    @JsonProperty("mobileNo")
    private String mobileNo;

    @JsonProperty("vendorId")
    private String vendorId;

    @JsonProperty("offset")
    private Integer offset;

    @JsonProperty("status")
    private Boolean status;

    @JsonProperty("limit")
    private Integer limit;
}
