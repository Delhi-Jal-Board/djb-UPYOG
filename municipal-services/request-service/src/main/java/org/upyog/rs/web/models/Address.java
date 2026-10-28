package org.upyog.rs.web.models;


import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.validation.annotation.Validated;
import org.upyog.rs.enums.AddressType;
import org.upyog.rs.validator.CreateApplicationGroup;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.annotation.processing.Generated;
import javax.validation.constraints.NotBlank;

/**
 * Representation of a address. Indiavidual APIs may choose to extend from this
 * using allOf if more details needed to be added in their case.
 */
@Schema(description = "Representation of a address. Indiavidual APIs may choose to extend from this using allOf if more details needed to be added in their case. ")
@Validated
@Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-19T11:17:29.419+05:30")

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Address {

	private String addressId;

	private String applicantId;

	private String doorNo;

	@NotBlank
	private String houseNo;
	
	private String streetName;
	
	@NotBlank
	private String addressLine1;

	private String addressLine2;
	
	private String landmark;

	@NotBlank
	private String city;

	@NotBlank
	private String cityCode;

	@NotBlank
	private String locality;

	@NotBlank
	private String localityCode;

	private String latitude;

	private String longitude;

	private String type;

	@JsonProperty("ward")
	private String ward;

	@JsonProperty("zone")
	private String zone;

	@JsonProperty("constituency")
	private String constituency;

	@NotBlank
	private String pincode;

	private AddressType addressType;

}
