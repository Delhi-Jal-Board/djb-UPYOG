package org.egov.vendor.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Component
public class VendorConfiguration {

	@org.springframework.context.annotation.Bean
	@org.springframework.context.annotation.Primary
	public org.springframework.web.client.RestTemplate vendorRestTemplate() {
		org.springframework.http.client.SimpleClientHttpRequestFactory factory =
				new org.springframework.http.client.SimpleClientHttpRequestFactory();
		factory.setConnectTimeout(5000);
		factory.setReadTimeout(10000);
		return new org.springframework.web.client.RestTemplate(factory);
	}

	// ── Persister topics — Vendor ─────────────────────────────────────────────
	@Value("${persister.save.vendor.topic}")
	private String saveTopic;

	@Value("${persister.save.vendordrivermapping.topic}")
	private String saveVendorDriverMappingTopic;


	@Value("${persister.update.vendor.topic}")
	private String updateTopic;


	// ── Persister topics — Driver ─────────────────────────────────────────────
	@Value("${persister.save.driver.topic}")
	private String saveDriverTopic;

	@Value("${persister.update.driver.topic}")
	private String updateDriverTopic;

	@Value("${persister.save.vendordrivervehicle.topic}")
	private String saveVendorVehicleDriverTopic;

	// ── Persister topics — Supervisor ─────────────────────────────────────────
	@Value("${persister.save.supervisor.topic}")
	private String saveSupervisorTopic;

	@Value("${persister.update.supervisor.topic}")
	private String updateSupervisorTopic;

	// ── Persister topics — Surveyor ───────────────────────────────────────────
	@Value("${persister.save.surveyor.topic}")
	private String saveSurveyorTopic;

	@Value("${persister.update.surveyor.topic}")
	private String updateSurveyorTopic;

	// ── MDMS ──────────────────────────────────────────────────────────────────
	@Value("${egov.mdms.host}")
	private String mdmsHost;

	@Value("${egov.mdms.search.endpoint}")
	private String mdmsEndPoint;

	// ── User service ──────────────────────────────────────────────────────────
	@Value("${egov.user.host}")
	private String userHost;

	@Value("${egov.user.context.path}")
	private String userContextPath;

	@Value("${egov.user.create.path}")
	private String userCreateEndpoint;

	@Value("${egov.user.search.path}")
	private String userSearchEndpoint;

	@Value("${egov.user.update.path}")
	private String userUpdateEndpoint;

	@Value("${egov.user.username.prefix}")
	private String usernamePrefix;

	// ── Vehicle service ───────────────────────────────────────────────────────
	@Value("${egov.vehicle.host}")
	private String vehicleHost;

	@Value("${egov.vehicle.context.path}")
	private String vehicleContextPath;

	@Value("${egov.vehicle.create.endpoint}")
	private String vehicleCreateEndpoint;

	@Value("${egov.vehicle.search.endpoint}")
	private String vehicleSearchEndpoint;

	@Value("${egov.vehicle.update.endpoint}")
	private String vehicleUpdateEndpoint;

	// ── HRMS ──────────────────────────────────────────────────────────────────
	@Value("${egov.hrms.host}")
	private String employeeHost;

	@Value("${egov.hrms.context.path}")
	private String employeeContextPath;

	@Value("${egov.hrms.create.path}")
	private String employeeCreateEndpoint;

	@Value("${egov.hrms.search.path}")
	private String employeeSearchEndpoint;

	@Value("${egov.hrms.update.path}")
	private String employeeUpdateEndpoint;

	// NOTE: ownernamePrefix is intentionally not @Value — was commented out
	private String ownernamePrefix;

	// ── Location ──────────────────────────────────────────────────────────────
	@Value("${egov.location.host}")
	private String locationHost;

	@Value("${egov.location.context.path}")
	private String locationContextPath;

	@Value("${egov.location.endpoint}")
	private String locationEndpoint;

	@Value("${egov.location.hierarchyTypeCode}")
	private String hierarchyTypeCode;

	// ── Search config ─────────────────────────────────────────────────────────
	@Value("${employee.allowed.search.params}")
	private String allowedEmployeeSearchParameters;

	@Value("${citizen.allowed.search.params}")
	private String allowedCitizenSearchParameters;

	@Value("${egov.vendorregistory.default.limit}")
	private Integer defaultLimit;

	@Value("${egov.vendorregistory.default.offset}")
	private Integer defaultOffset;

	@Value("${egov.vendorregistory.max.limit}")
	private Integer maxSearchLimit;

	/**
	 * Commented this as moved this mapping  to MDMS data
	 */

	/* @Value("${dso.role}")
	private String dsoRole;

	@Value("${dso.driver}")
	private String dsoDriver;

	@Value("${dso.role.name}")
	private String dsoRoleName;

	@Value("${dso.driver.role.name}")
	private String dsoDriverRoleName; */

	@Value("${citizen.role}")
	private String citizenRole;

	@Value("${citizen.role.name}")
	private String citizenRoleName;

	@Value("${vendor.driver.mobile.number}")
	private String driverMobileNumberIncrement;

}