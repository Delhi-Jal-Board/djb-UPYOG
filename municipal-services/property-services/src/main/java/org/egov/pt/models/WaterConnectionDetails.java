package org.egov.pt.models;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@ToString
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaterConnectionDetails {

	@JsonProperty("status")
	private String status;

	@JsonProperty("hasWaterConnection")
	private Boolean hasWaterConnection;

	@JsonProperty("hasExistingApplication")
	private Boolean hasExistingApplication;

	@JsonProperty("applicationNo")
	private String applicationNo;

	@JsonProperty("applicationStatus")
	private String applicationStatus;

	@JsonProperty("connectionNo")
	private String connectionNo;

	@JsonProperty("canApply")
	private Boolean canApply;

	@JsonProperty("message")
	private String message;

}
