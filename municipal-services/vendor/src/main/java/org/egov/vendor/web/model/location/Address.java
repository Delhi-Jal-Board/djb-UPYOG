package org.egov.vendor.web.model.location;

import org.egov.vendor.web.model.AuditDetails;
import org.hibernate.validator.constraints.SafeHtml;
import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * Representation of a address. Indiavidual APIs may choose to extend from this
 * using allOf if more details needed to be added in their case.
 */
//@Schema(description = "Representation of a address. Indiavidual APIs may choose to extend from this using allOf if more details needed to be added in their case. ")
@Validated
@javax.annotation.Generated(value = "io.swagger.codegen.v3.generators.java.SpringCodegen", date = "2021-01-06T05:34:12.238Z[GMT]")
@AllArgsConstructor
@EqualsAndHashCode
@Getter
@NoArgsConstructor
@Setter
@ToString
@Builder
public class Address {

	@SafeHtml
	@JsonProperty("tenantId")
	private String tenantId = null;

	@SafeHtml
	@JsonProperty("doorNo")
	private String doorNo = null;

	@SafeHtml
	@JsonProperty("plotNo")
	private String plotNo = null;

	@SafeHtml
	@JsonProperty("id")
	private String id = null;

	@SafeHtml
	@JsonProperty("landmark")
	private String landmark = null;

	@SafeHtml
	@JsonProperty("city")
	private String city = null;

	@SafeHtml
	@JsonProperty("district")
	private String district = null;

	@SafeHtml
	@JsonProperty("region")
	private String region = null;

	@SafeHtml
	@JsonProperty("state")
	private String state = null;

	@SafeHtml
	@JsonProperty("country")
	private String country = null;

	@SafeHtml
	@JsonProperty("pincode")
	private String pincode = null;

	@JsonProperty("additionalDetails")
	private Object additionalDetails = null;

	@SafeHtml
	@JsonProperty("buildingName")
	private String buildingName = null;

	@SafeHtml
	@JsonProperty("street")
	private String street = null;

	@JsonProperty("locality")
	private Boundary locality = null;

	@JsonProperty("geoLocation")
	private GeoLocation geoLocation = null;

	@JsonProperty("auditDetails")
	private AuditDetails auditDetails = null;

	@JsonProperty("latitude")
	private Double latitude = null;

	@JsonProperty("longitude")
	private Double longitude = null;

	@SafeHtml
	@JsonProperty("subLocality")
	private String subLocality = null;

	@SafeHtml
	@JsonProperty("actualAssembly")
	private String actualAssembly = null;

	@SafeHtml
	@JsonProperty("actualZone")
	private String actualZone = null;

	@SafeHtml
	@JsonProperty("actualWard")
	private String actualWard = null;

	@SafeHtml
	@JsonProperty("addressLine1")
	private String addressLine1 = null;

	@SafeHtml
	@JsonProperty("addressLine2")
	private String addressLine2 = null;

	@SafeHtml
	@JsonProperty("assembly")
	private String assembly = null;

	@SafeHtml
	@JsonProperty("block")
	private String block = null;

	@SafeHtml
	@JsonProperty("zone")
	private String zone = null;

}
