package org.upyog.rs.web.models.fillingpoint;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class FillingPointMetadata {

    @JsonProperty("id")
    private String id;
    private String name;           // → filling_point_name + emergency_name
    private String mobileNumber;   // → emergency mobile
    private String emailId;        // → emergency email

    private String jeName;
    private String jeMobileNumber; // ← frontend naming
    private String jeEmailId;

    private String eeName;
    private String eeMobileNumber; // ← frontend naming
    private String eeEmailId;


    private String aeName;
    private String aeMobileNumber;
    private String aeEmailId;
    private Boolean status;

    private String type;
}
