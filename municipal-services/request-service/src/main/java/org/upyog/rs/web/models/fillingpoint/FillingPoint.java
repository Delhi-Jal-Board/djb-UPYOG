package org.upyog.rs.web.models.fillingpoint;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.upyog.rs.web.models.Address;

import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FillingPoint {

    private String id;

    @JsonProperty("fillingPointId")
    private String fillingPointId;
    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("fillingPointName")
    private String fillingPointName;

    @JsonProperty("emergencyName")
    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String emergencyName;

    @JsonProperty("eeName")
    private String eeName;

    @JsonProperty("eeEmail")
    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String eeEmail;

    @JsonProperty("eeMobile")
    private String eeMobile;

    @JsonProperty("aeName")
    private String aeName;

    @JsonProperty("aeEmail")
    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String aeEmail;

    @JsonProperty("aeMobile")
    private String aeMobile;

    @JsonProperty("jeName")
    private String jeName;

    @JsonProperty("jeEmail")
    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String jeEmail;

    @JsonProperty("jeMobile")
    private String jeMobile;

    @JsonProperty("createdBy")
    private String createdBy;

    @JsonProperty("lastModifiedBy")
    private String lastModifiedBy;

    @JsonProperty("createdTime")
    private Long createdTime;

    @JsonProperty("lastModifiedTime")
    private Long lastModifiedTime;

    @JsonProperty("fillingPointLocalityCodes")
    private List<String> localityCodes;

    @JsonProperty("status")
    private Boolean status;

    private Address address;
}
