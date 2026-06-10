package org.egov.vendor.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import javax.validation.Valid;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.tracer.model.CustomException;
import org.egov.vendor.config.VendorConfiguration;
import org.egov.vendor.driver.web.model.Driver;
import org.egov.vendor.repository.VendorRepository;
import org.egov.vendor.supervisor.repository.SupervisorRepository;
import org.egov.vendor.util.*;
import org.egov.vendor.validator.VendorValidator;
import org.egov.vendor.web.model.Vendor;
import org.egov.vendor.web.model.VendorRequest;
import org.egov.vendor.web.model.VendorResponse;
import org.egov.vendor.web.model.VendorSearchCriteria;
import org.egov.vendor.web.model.user.User;
import org.egov.vendor.web.model.user.UserDetailResponse;
import org.egov.vendor.web.model.vehicle.Vehicle;
import org.egov.vendor.web.model.vehicle.VehicleSearchCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class VendorService {

	@Autowired
	private VendorUtil util;

	@Autowired
	private VendorRepository vendorRepository;

	@Autowired
	private VendorValidator vendorValidator;

	@Autowired
	private VendorRepository repository;

	@Autowired
	private EnrichmentService enrichmentService;

	@Autowired
	private VehicleService vehicleService;

	@Autowired
	private UserService userService;

	@Autowired
	private VendorConfiguration config;

	@Autowired
	private SupervisorRepository supervisorRepository;


	public Vendor create(VendorRequest vendorRequest) {
		RequestInfo requestInfo = vendorRequest.getRequestInfo();

		String tenantId = vendorRequest.getVendor().getTenantId().split("\\.")[0];
		if (vendorRequest.getVendor().getTenantId().split("\\.").length == 1) {
			throw new CustomException("Invalid TenantId", " Application cannot be create at StateLevel");
		}
		Object mdmsData = util.mDMSCall(requestInfo, tenantId);
		vendorValidator.validateCreateOrUpdateRequest(vendorRequest, mdmsData, true, requestInfo);
		enrichmentService.enrichCreate(vendorRequest);
		vendorRepository.save(vendorRequest);
		return vendorRequest.getVendor();

	}

	public Vendor update(VendorRequest vendorRequest) {
		RequestInfo requestInfo = vendorRequest.getRequestInfo();
		String tenantId = vendorRequest.getVendor().getTenantId().split("\\.")[0];

		if (vendorRequest.getVendor().getTenantId().split("\\.").length == 1) {
			throw new CustomException("Invalid TenantId", " Application cannot be updated at StateLevel");
		}

		if (vendorRequest.getVendor() != null && vendorRequest.getVendor().getId() == null) {
			throw new CustomException(VendorConstants.UPDATE_ERROR,
					"Vendor Not found in the System" + vendorRequest.getVendor().getName());
		}

		if (vendorRequest.getVendor() != null && vendorRequest.getVendor().getAddress() != null
				&& vendorRequest.getVendor().getAddress().getId() == null) {
			throw new CustomException(VendorConstants.UPDATE_ERROR,
					"Vendor address not found in the System" + vendorRequest.getVendor().getAddress());
		}

		if (vendorRequest.getVendor() != null && vendorRequest.getVendor().getOwner() == null) {
			throw new CustomException(VendorConstants.UPDATE_ERROR,
					"Owner details not present in the present" + vendorRequest.getVendor().getName());
		}

		VendorSearchCriteria criteria = new VendorSearchCriteria();
		criteria.setTenantId(vendorRequest.getVendor().getTenantId());
		criteria.setIds(Arrays.asList(vendorRequest.getVendor().getId()));


		VendorResponse existingVendorResult = vendorsearch(criteria, requestInfo);



		if (existingVendorResult != null) {
//			System.out.println("Vendor size = "
//					+ existingVendorResult.getVendor().size());
		}

		if (existingVendorResult != null && existingVendorResult.getVendor().isEmpty()) {
			throw new CustomException(VendorConstants.UPDATE_ERROR,
					"Vendor Not found in the System" + vendorRequest.getVendor().getName());
		}
		if (existingVendorResult != null && existingVendorResult.getVendor().size() > 1) {
			throw new CustomException(VendorConstants.UPDATE_ERROR,
					"Found multiple application(s)" + vendorRequest.getVendor().getName());
		}

		Vendor oldVendor = existingVendorResult != null ? existingVendorResult.getVendor().get(0) : new Vendor();

		if (!oldVendor.getOwnerId().equalsIgnoreCase(vendorRequest.getVendor().getOwnerId())) {
			throw new CustomException(VendorConstants.UPDATE_ERROR,
					"OwnerId mismatch between the update request and existing vendor record"
							+ vendorRequest.getVendor().getName());
		}

		if (oldVendor.getOwner() != null && vendorRequest.getVendor().getOwner() != null && !oldVendor.getOwner()
				.getMobileNumber().equalsIgnoreCase(vendorRequest.getVendor().getOwner().getMobileNumber())) {
			throw new CustomException(VendorConstants.UPDATE_ERROR,
					"Mobile number update is not allowed" + vendorRequest.getVendor().getOwner().getMobileNumber());
		}

		Object mdmsData = util.mDMSCall(requestInfo, tenantId);
		vendorValidator.validateCreateOrUpdateRequest(vendorRequest, mdmsData, false, requestInfo);
		enrichmentService.enrichUpdate(vendorRequest);
		updateVendor(vendorRequest, tenantId);

		return vendorRequest.getVendor();

	}

	private void updateVendor(VendorRequest vendorRequest, String tenantId) {
		List<Driver> vendorDriverToBeUpdated = new ArrayList<>();
		List<Driver> vendorDriverToBeInserted = new ArrayList<>();
		List<Vehicle> vendorVehicleToBeUpdated = new ArrayList<>();
		List<Vehicle> vendorVehicleToBeInserted = new ArrayList<>();

		List<Vehicle> beforeUpdateOrInsertVehicle = new ArrayList<>();
		List<Driver> beforeUpdateOrInsertDriver = new ArrayList<>();
		getVehicleDriver(vendorRequest, vendorDriverToBeUpdated, vendorDriverToBeInserted, beforeUpdateOrInsertDriver,
				tenantId);
		getVendorVehicle(vendorRequest, vendorVehicleToBeUpdated, beforeUpdateOrInsertVehicle,
				vendorVehicleToBeInserted, tenantId);
		if (!CollectionUtils.isEmpty(vendorVehicleToBeUpdated)) {
			vendorRequest.getVendor().getVehicles().clear();
			vendorRequest.getVendor().setVehicles(vendorVehicleToBeUpdated);

		}

		boolean mappingDeleted = false;

		if (!CollectionUtils.isEmpty(vendorDriverToBeUpdated)) {

			vendorRequest.getVendor().setDrivers(new ArrayList<>(vendorDriverToBeUpdated));

			mappingDeleted = vendorRepository.updateVendorDriverHistory(vendorRequest);
		}

		if (mappingDeleted) {

			vendorRequest.getVendor().setDrivers(new ArrayList<>(vendorDriverToBeUpdated));

			vendorRepository.updateVendorDriver(vendorRequest);
		}

        // clear drivers before normal vendor update
		if (vendorRequest.getVendor().getDrivers() != null) {
			vendorRequest.getVendor().getDrivers().clear();
		}

		vendorRepository.update(vendorRequest);

		boolean callInsert = false;

		if (vendorRequest.getVendor().getDrivers() != null && !vendorRequest.getVendor().getDrivers().isEmpty()) {
			vendorRequest.getVendor().getDrivers().clear();
		}

		if (vendorRequest.getVendor().getVehicles() != null && !vendorRequest.getVendor().getVehicles().isEmpty()) {
			vendorRequest.getVendor().getVehicles().clear();
		}

		if (!CollectionUtils.isEmpty(vendorVehicleToBeInserted)) {
			vendorRequest.getVendor().setVehicles(vendorVehicleToBeInserted);
			callInsert = true;
		}
		if (!CollectionUtils.isEmpty(vendorDriverToBeInserted)) {
			vendorRequest.getVendor().setDrivers(vendorDriverToBeInserted);
			callInsert = true;
		}

		if (callInsert) {
			vendorRepository.updateVendorVehicleDriver(vendorRequest);
		}

		if (!CollectionUtils.isEmpty(beforeUpdateOrInsertVehicle)) {
			vendorRequest.getVendor().setVehicles(beforeUpdateOrInsertVehicle);
		}

		if (!CollectionUtils.isEmpty(beforeUpdateOrInsertDriver)) {
			vendorRequest.getVendor().setDrivers(beforeUpdateOrInsertDriver);
		}

	}

	private void getVehicleDriver(VendorRequest vendorRequest, List<Driver> vendorDriverToBeUpdated,
	                              List<Driver> vendorDriverToBeInserted, List<Driver> beforeUpdateOrInsertDriver, String tenantId) {
		if (vendorRequest.getVendor().getDrivers() != null && !vendorRequest.getVendor().getDrivers().isEmpty()) {

			vendorRequest.getVendor().getDrivers().forEach(driver -> {
				List<String> driverIds = vendorRepository.getVendorWithDrivers(VendorSearchCriteria.builder()
						.driverIds(Arrays.asList(driver.getId())).tenantId(tenantId).build());
				if (!CollectionUtils.isEmpty(driverIds)) {
					vendorDriverToBeUpdated.add(driver);
				} else {
					vendorDriverToBeInserted.add(driver);
				}
				beforeUpdateOrInsertDriver.add(driver);
			});
		}

	}

	private void getVendorVehicle(VendorRequest vendorRequest, List<Vehicle> vendorVehicleToBeUpdated,
	                              List<Vehicle> beforeUpdateOrInsertVehicle, List<Vehicle> vendorVehicleToBeInserted, String tenantId) {
		if (vendorRequest.getVendor().getVehicles() != null && !vendorRequest.getVendor().getVehicles().isEmpty()) {
			vendorRequest.getVendor().getVehicles().forEach(vehicle -> {
				List<String> vehicleIds = vendorRepository.getVendorWithVehicles(VendorSearchCriteria.builder()
						.vehicleIds(Arrays.asList(vehicle.getId())).tenantId(tenantId).build());
				if (!CollectionUtils.isEmpty(vehicleIds)) {
					vendorVehicleToBeUpdated.add(vehicle);
				} else {
					vendorVehicleToBeInserted.add(vehicle);
				}
				beforeUpdateOrInsertVehicle.add(vehicle);
			});
		}

	}

	public VendorResponse vendorsearch(VendorSearchCriteria criteria, RequestInfo requestInfo) {

		UserDetailResponse userDetailResponse;



		vendorValidator.validateSearch(requestInfo, criteria);
		applyRoleBasedSearchRestrictions(criteria, requestInfo);

		if (criteria.getMobileNumber() != null) {
			userDetailResponse = userService.getOwner(criteria, requestInfo);
			if (userDetailResponse != null && userDetailResponse.getUser() != null
					&& !userDetailResponse.getUser().isEmpty()) {
				List<String> uuids = userDetailResponse.getUser().stream().map(User::getUuid)
						.collect(Collectors.toList());
				if (CollectionUtils.isEmpty(criteria.getOwnerIds())) {
					criteria.setOwnerIds(uuids);
				} else {
					criteria.getOwnerIds().addAll(uuids);
				}
			}
		}


		if (criteria.getLimit() == null) {
			criteria.setLimit(config.getMaxSearchLimit());
		}

		if (criteria.getOffset() == null) {
			criteria.setOffset(config.getDefaultOffset());
		}

		VendorSearchCriteria vendorCriteria = getCriteria(criteria, requestInfo);
		VendorResponse vendorResponse = new VendorResponse();
		if ((CollectionUtils.isEmpty(criteria.getDriverIds()) && CollectionUtils.isEmpty(criteria.getVehicleIds()))
				|| !CollectionUtils.isEmpty(vendorCriteria.getIds())) {

			vendorResponse = repository.getVendorData(criteria);
			if (vendorResponse != null && !vendorResponse.getVendor().isEmpty()) {
				enrichmentService.enrichVendorSearch(vendorResponse.getVendor(), requestInfo, criteria.getTenantId());
			}
			if (vendorResponse != null && vendorResponse.getVendor().isEmpty()) {
				vendorIsEmpty();
			}
		}

		return vendorResponse;
	}
	/**
	 * DB-based vendor search scoping — does NOT rely on JWT/DIGIT roles.
	 *
	 * ZUUL replaces userInfo.roles with Keycloak realm roles before forwarding.
	 * DIGIT roles (EKYC_VENDOR, EKYC_SUPERVISOR) are never present here.
	 * Identify caller by UUID directly in DB:
	 *
	 *   UUID in eg_supervisor → supervisor → scope to their vendor only
	 *   UUID in eg_vendor     → vendor     → scope to their own record
	 *   Neither + EMPLOYEE    → unrestricted
	 *   Neither + CITIZEN     → falls through to ownerIds = uuid (no match = empty, safe)
	 *
	 * Security: UUID from Keycloak JWT is cryptographically signed — cannot be spoofed.
	 */
	private void applyRoleBasedSearchRestrictions(VendorSearchCriteria criteria, RequestInfo requestInfo) {
		if (requestInfo == null || requestInfo.getUserInfo() == null) return;

		// SUPERUSER / EMPLOYEE — unrestricted
		if (isEmployeeUser(requestInfo)) return;

		String loggedInUuid = requestInfo.getUserInfo().getUuid();
		if (!StringUtils.hasLength(loggedInUuid))
			throw new CustomException("AUTH_ERROR", "User UUID not found in session. Search restricted.");

		criteria.setMobileNumber(null); // always clear — mobile is encrypted in token

		// Check DB: is this caller a supervisor?
		List<String> vendorIdsViaSupervisor = supervisorRepository.getVendorIdsByOwner(loggedInUuid);
		if (!CollectionUtils.isEmpty(vendorIdsViaSupervisor)) {
			// Supervisor — scope to their vendor only via vendor id
			criteria.setIds(Collections.singletonList(vendorIdsViaSupervisor.get(0)));
			criteria.setOwnerIds(null);
			log.info("Vendor search scoped to vendorId={} for supervisor uuid={}",
					vendorIdsViaSupervisor.get(0), loggedInUuid);
			return;
		}

		// Check DB: is this caller a vendor owner?
		// Scope via owner_id — vendor can only see their own record
		criteria.setOwnerIds(Collections.singletonList(loggedInUuid));
		log.info("Vendor search scoped to ownerUuid={}", loggedInUuid);
	}

	private boolean isEmployeeUser(RequestInfo requestInfo) {
		if (requestInfo == null || requestInfo.getUserInfo() == null) {
			return false;
		}

		// Check by Type (Standard eGov logic)
		if (VendorConstants.EMPLOYEE.equalsIgnoreCase(requestInfo.getUserInfo().getType())) {
			return true;
		}

		// Check by Role Code (Defensive logic)
		return !CollectionUtils.isEmpty(requestInfo.getUserInfo().getRoles()) &&
				requestInfo.getUserInfo().getRoles().stream()
						.map(Role::getCode)
						.anyMatch(role -> role.equalsIgnoreCase("EMPLOYEE") || role.equalsIgnoreCase("SUPERUSER") || role.equalsIgnoreCase("WT_CEMP") );
	}

	private VendorSearchCriteria getCriteria(VendorSearchCriteria criteria, RequestInfo requestInfo) {
		if (!CollectionUtils.isEmpty(criteria.getVehicleRegistrationNumber())
				|| StringUtils.hasLength(criteria.getVehicleType())
				|| StringUtils.hasLength(criteria.getVehicleCapacity())) {
			List<Vehicle> vehicles = callGetVehicleRepo(requestInfo, criteria);

			if (CollectionUtils.isEmpty(vehicles)) {
				vendorIsEmpty();
			}
			if (CollectionUtils.isEmpty(criteria.getVehicleIds())) {
				criteria.setVehicleIds(vehicles.stream().map(Vehicle::getId).collect(Collectors.toList()));
			} else {
				criteria.getVehicleIds().addAll(vehicles.stream().map(Vehicle::getId).collect(Collectors.toList()));
			}

		}

		if (!CollectionUtils.isEmpty(criteria.getVehicleIds())) {
			List<String> vendorIds = repository.getVendorWithVehicles(criteria);
			if (CollectionUtils.isEmpty(vendorIds)) {
				vendorIsEmpty();

			} else {
				if (CollectionUtils.isEmpty(criteria.getIds())) {
					criteria.setIds(vendorIds);
				} else {
					criteria.getIds().addAll(vendorIds);
				}
			}
		}

		return getDriversCriteria(criteria);
	}

	private VendorSearchCriteria getDriversCriteria(VendorSearchCriteria criteria) {
		if (!CollectionUtils.isEmpty(criteria.getDriverIds())) {
			List<String> vendorIds = repository.getVendorWithDrivers(criteria);
			if (CollectionUtils.isEmpty(vendorIds)) {
				vendorIsEmpty();

			} else {
				if (CollectionUtils.isEmpty(criteria.getIds())) {
					criteria.setIds(vendorIds);
				} else {
					criteria.getIds().addAll(vendorIds);
				}
			}

		}
		return criteria;
	}

	private VendorResponse vendorIsEmpty() {
		List<Vendor> vendors = new ArrayList<>();
		VendorResponse vendorResponse = new VendorResponse();
		vendorResponse.setVendor(vendors);
		return vendorResponse;
	}

	private List<Vehicle> callGetVehicleRepo(RequestInfo requestInfo, VendorSearchCriteria criteria) {
		VehicleSearchCriteria vehicleSearchCriteria = VehicleSearchCriteria.builder()
				.registrationNumber(criteria.getVehicleRegistrationNumber()).vehicleType(criteria.getVehicleType())
				.vehicleCapacity(criteria.getVehicleCapacity()).tenantId(criteria.getTenantId())
				.status(criteria.getStatus()).build();

		return vehicleService.getVehicles(vehicleSearchCriteria, requestInfo);

	}

	public List<Vendor> vendorPlainSearch(@Valid VendorSearchCriteria criteria, RequestInfo requestInfo) {
		return getVendorPlainSearch(criteria, requestInfo);
	}

	private List<Vendor> getVendorPlainSearch(@Valid VendorSearchCriteria criteria, RequestInfo requestInfo) {
		if (criteria.getLimit() != null && criteria.getLimit() > config.getMaxSearchLimit())
			criteria.setLimit(config.getMaxSearchLimit());

		List<String> ids = null;

		if (criteria.getIds() != null && !criteria.getIds().isEmpty())
			ids = criteria.getIds();
		else
			ids = repository.fetchVendorIds(criteria);

		if (ids.isEmpty())
			return Collections.emptyList();

		VendorSearchCriteria vendorCriteria = VendorSearchCriteria.builder().ids(ids).build();

		List<Vendor> vendorList = repository.getVendorPlainSearch(vendorCriteria);
		if (!vendorList.isEmpty()) {
			enrichmentService.enrichVendorSearch(vendorList, requestInfo, criteria.getTenantId());
		}

		return vendorList;
	}

}
