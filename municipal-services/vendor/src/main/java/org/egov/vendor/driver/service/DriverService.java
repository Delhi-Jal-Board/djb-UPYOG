package org.egov.vendor.driver.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.tracer.model.CustomException;
import org.egov.vendor.config.VendorConfiguration;
import org.egov.vendor.driver.repository.DriverRepository;
import org.egov.vendor.driver.web.model.Driver;
import org.egov.vendor.driver.web.model.DriverRequest;
import org.egov.vendor.driver.web.model.DriverResponse;
import org.egov.vendor.driver.web.model.DriverSearchCriteria;
import org.egov.vendor.util.VendorConstants;
import org.egov.vendor.web.model.user.User;
import org.egov.vendor.web.model.user.UserDetailResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;

@Service
@Slf4j
public class DriverService {

	@Autowired
	private DriverRepository driverRepository;

	@Autowired
	private DriverEnrichmentService enrichmentService;

	@Autowired
	private DriverUserService userService;

	@Autowired
	private VendorConfiguration config;

	public Driver create(DriverRequest driverRequest) {

		if (driverRequest.getDriver().getTenantId().split("\\.").length == 1) {
			throw new CustomException("Invalid TenantId", " Application cannot be create at StateLevel");
		}
		//driverRequest.getDriver().getOwner().setMobileNumber(driverRepository.getdriverSeqMobileNum(getSeqDriverMobileNumber()));
		userService.manageDrivers(driverRequest, true);
		enrichmentService.enrichCreate(driverRequest);
		driverRepository.save(driverRequest);
		return driverRequest.getDriver();

	}

	/*
	 * This method is to increment mobile number each time driver is created
	 */
	private String getSeqDriverMobileNumber() {
		return config.getDriverMobileNumberIncrement();
	}

	public Driver update(DriverRequest driverRequest) {

		if (driverRequest.getDriver().getTenantId().split("\\.").length == 1) {
			throw new CustomException("Invalid TenantId", " Application cannot be updated at StateLevel");
		}
		userService.manageDrivers(driverRequest, false);
		enrichmentService.enrichUpdate(driverRequest);
		//driverRepository.updateVendorDriverHistory(driverRequest);
		driverRepository.update(driverRequest);
		return driverRequest.getDriver();

	}

//	private void applyDriverRoleBasedRestriction(DriverSearchCriteria criteria, RequestInfo requestInfo) {
//
//		// ✅ 1. Null safety
//		if (requestInfo == null || requestInfo.getUserInfo() == null) {
//			return;
//		}
//
//		if (isEmployeeUser(requestInfo)) {
//			return;
//		}
//
//		boolean isVendor = requestInfo.getUserInfo().getRoles().stream()
//				.anyMatch(r -> "WT_VENDOR".equalsIgnoreCase(r.getCode()));
//
//		if (!isVendor) {
//			return;
//		}
//
//		String ownerUuid = requestInfo.getUserInfo().getUuid();
//
//		if (!StringUtils.hasLength(ownerUuid)) {
//			throw new CustomException("AUTH_ERROR", "User UUID not found");
//		}
//
//		log.info("Applying vendor-based driver restriction for UUID: {}", ownerUuid);
//
//		List<String> vendorIds = driverRepository.getVendorIdsByOwner(ownerUuid);
//
//		if (CollectionUtils.isEmpty(vendorIds)) {
//			criteria.setIds(new ArrayList<>());
//			return;
//		}
//
//		String vendorId = vendorIds.get(0);
//
//		List<String> vendorDriverIds = driverRepository.getDriverIdsByVendorId(vendorId);
//
//		if (CollectionUtils.isEmpty(vendorDriverIds)) {
//			criteria.setIds(new ArrayList<>());
//			return;
//		}
//
//		if (CollectionUtils.isEmpty(criteria.getIds())) {
//			criteria.setIds(new ArrayList<>(vendorDriverIds));
//		} else {
//			List<String> filtered = criteria.getIds().stream()
//					.filter(vendorDriverIds::contains)
//					.collect(Collectors.toList());
//
//			criteria.setIds(filtered);
//		}
//	}

	private void applyDriverRoleBasedRestriction(DriverSearchCriteria criteria, RequestInfo requestInfo) {

		if (requestInfo == null || requestInfo.getUserInfo() == null) {
			return;
		}

		List<String> roleCodes = requestInfo.getUserInfo().getRoles().stream()
				.map(Role::getCode)
				.collect(Collectors.toList());

		String userType = requestInfo.getUserInfo().getType();

		// Check individual flags
		boolean isEmployee = "EMPLOYEE".equalsIgnoreCase(userType)
				|| roleCodes.stream().anyMatch(r ->
				"EMPLOYEE".equalsIgnoreCase(r) ||
						"SUPERUSER".equalsIgnoreCase(r) ||
						"WT_CEMP".equalsIgnoreCase(r)
		);

		boolean isVendor = roleCodes.stream().anyMatch(r -> "WT_VENDOR".equalsIgnoreCase(r));
		boolean isCitizen = "CITIZEN".equalsIgnoreCase(userType);

		// If user has BOTH employee-level role AND vendor role → employee wins, no restriction
		if (isEmployee) {
			log.info("Employee/Superuser role detected. Skipping restrictions even if WT_VENDOR is present.");
			return;
		}

		// Only restrict if STRICTLY vendor or citizen (no employee roles)
		if (!isVendor && !isCitizen) {
			log.info("No vendor/citizen role found. Skipping restrictions.");
				//System.out.println("test2 ");
			return;
		}

		String ownerUuid = requestInfo.getUserInfo().getUuid();
		if (!StringUtils.hasLength(ownerUuid)) {
			throw new CustomException("AUTH_ERROR", "User UUID not found");
		}

		log.info("Applying vendor/citizen restriction for UUID: {}", ownerUuid);

		List<String> vendorIds = driverRepository.getVendorIdsByOwner(ownerUuid);

		if (CollectionUtils.isEmpty(vendorIds)) {
			log.info("No vendor record found for UUID: {}. Returning empty.", ownerUuid);
			criteria.setIds(new ArrayList<>());
			return;
		}

		String vendorId = vendorIds.get(0);
		List<String> vendorDriverIds = driverRepository.getDriverIdsByVendorId(vendorId);

		if (CollectionUtils.isEmpty(vendorDriverIds)) {
			criteria.setIds(new ArrayList<>());
		} else {
			if (CollectionUtils.isEmpty(criteria.getIds())) {
				criteria.setIds(new ArrayList<>(vendorDriverIds));
			} else {
				criteria.getIds().retainAll(vendorDriverIds);
			}
		}
	}

private boolean isEmployeeUser(RequestInfo requestInfo) {

		if (requestInfo == null || requestInfo.getUserInfo() == null) {
			return false;
		}

		if (VendorConstants.EMPLOYEE.equalsIgnoreCase(requestInfo.getUserInfo().getType())) {
			return true;
		}

		return !CollectionUtils.isEmpty(requestInfo.getUserInfo().getRoles()) &&
				requestInfo.getUserInfo().getRoles().stream()
						.map(Role::getCode)
						.anyMatch(role ->
								"EMPLOYEE".equalsIgnoreCase(role) ||
										"SUPERUSER".equalsIgnoreCase(role) ||
										"WT_CEMP".equalsIgnoreCase(role)
						);
	}

	public DriverResponse search(DriverSearchCriteria criteria, RequestInfo requestInfo) {

		UserDetailResponse userDetailResponse;

		// Apply role-based restriction ONLY if vendorId is not explicitly provided
		if (!StringUtils.hasLength(criteria.getVendorId())) {
			applyDriverRoleBasedRestriction(criteria, requestInfo);
		}
		else {

			List<String> vendorIds =
					driverRepository.getVendorIdsByOwner(criteria.getVendorId());

			if (!CollectionUtils.isEmpty(vendorIds)) {
				String vendorId = vendorIds.get(0);
				List<String> driverIds =
						driverRepository.getDriverIdsByVendorId(vendorId);

				if (!CollectionUtils.isEmpty(driverIds)) {
					criteria.setVendorId(vendorId);
				}
			}
				validateVendorAccess(criteria.getVendorId(), requestInfo);
		}

		if (criteria.isDriverWithNoVendor()) {
			List<String> driverIds = driverRepository.fetchDriverIdsWithNoVendor(criteria);
			if (CollectionUtils.isEmpty(criteria.getIds())) {
				criteria.setIds(driverIds);
			} else {
				criteria.getIds().addAll(driverIds);
			}

		}

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
		return getDriverResponse(criteria, requestInfo);

	}

	private void validateVendorAccess(String requestedVendorId, RequestInfo requestInfo) {

		// Null safety
		if (requestInfo == null || requestInfo.getUserInfo() == null) {
			return;
		}

		// Employee/Superuser — allow any vendorId
		if (isEmployeeUser(requestInfo)) {
			return;
		}

		boolean isVendor = requestInfo.getUserInfo().getRoles().stream()
				.anyMatch(r -> "WT_VENDOR".equalsIgnoreCase(r.getCode()));

		boolean isCitizen = "CITIZEN".equalsIgnoreCase(requestInfo.getUserInfo().getType());

		// Only validate ownership for VENDOR or CITIZEN
		if (!isVendor && !isCitizen) {
			return;
		}

		String ownerUuid = requestInfo.getUserInfo().getUuid();
		if (!StringUtils.hasLength(ownerUuid)) {
			throw new CustomException("AUTH_ERROR", "User UUID not found");
		}

		// Fetch vendor IDs that actually belong to this user
		List<String> ownedVendorIds = driverRepository.getVendorIdsByOwner(ownerUuid);

		if (CollectionUtils.isEmpty(ownedVendorIds) || !ownedVendorIds.contains(requestedVendorId)) {
			throw new CustomException("UNAUTHORIZED_ACCESS",
					"Vendor/Citizen is not authorized to access drivers of vendor: " + requestedVendorId);
		}
	}
	private DriverResponse getDriverResponse(DriverSearchCriteria criteria, RequestInfo requestInfo) {
		DriverResponse driverResponse = driverRepository.getDriverData(criteria);
		if (driverResponse != null && !driverResponse.getDriver().isEmpty()) {
			enrichmentService.enrichDriverSearch(driverResponse.getDriver(), requestInfo, criteria.getTenantId());
		}
		if (driverResponse != null && driverResponse.getDriver().isEmpty()) {
			List<Driver> drivers = new ArrayList<>();
			driverResponse.setDriver(drivers);
			return driverResponse;
		}
		return driverResponse;
	}
}
