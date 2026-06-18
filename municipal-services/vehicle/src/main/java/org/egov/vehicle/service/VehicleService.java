package org.egov.vehicle.service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import javax.validation.Valid;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.tracer.model.CustomException;
import org.egov.vehicle.config.VehicleConfiguration;
import org.egov.vehicle.repository.VehicleRepository;
import org.egov.vehicle.util.Constants;
import org.egov.vehicle.util.VehicleErrorConstants;
import org.egov.vehicle.util.VehicleUtil;
import org.egov.vehicle.validator.Validator;
import org.egov.vehicle.web.model.Vehicle;
import org.egov.vehicle.web.model.VehicleRequest;
import org.egov.vehicle.web.model.VehicleResponse;
import org.egov.vehicle.web.model.VehicleSearchCriteria;
import org.egov.vehicle.web.model.user.User;
import org.egov.vehicle.web.model.user.UserDetailResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;

@Slf4j
@Service
public class VehicleService {

	@Autowired
	private VehicleUtil util;

	@Autowired
	private EnrichmentService enrichmentService;

	@Autowired
	private VehicleRepository repository;

	@Autowired
	private Validator validator;

	@Autowired
	private UserService userService;

	@Autowired
	private VehicleConfiguration config;

	public Vehicle create(VehicleRequest vehicleRequest) {

		RequestInfo requestInfo = vehicleRequest.getRequestInfo();
		String tenantId = vehicleRequest.getVehicle().getTenantId().split("\\.")[0];
		Object mdmsData = util.mDMSCall(requestInfo, tenantId);
		if (vehicleRequest.getVehicle().getTenantId().split("\\.").length == 1) {
			throw new CustomException(VehicleErrorConstants.INVALID_TENANT, " Vehicle cannot be created at StateLevel");
		}
		validator.validateCreateOrUpdate(vehicleRequest, mdmsData, false);
		enrichmentService.enrichVehicleCreateRequest(vehicleRequest);
		repository.save(vehicleRequest);
		return vehicleRequest.getVehicle();
	}

	public Vehicle update(VehicleRequest vehicleRequest) {

		RequestInfo requestInfo = vehicleRequest.getRequestInfo();
		String tenantId = vehicleRequest.getVehicle().getTenantId().split("\\.")[0];
		Object mdmsData = util.mDMSCall(requestInfo, tenantId);
		if (vehicleRequest.getVehicle().getTenantId().split("\\.").length == 1) {
			throw new CustomException(VehicleErrorConstants.INVALID_TENANT, " Vehicle cannot be updated at StateLevel");
		}

		validator.validateCreateOrUpdate(vehicleRequest, mdmsData, true);
		enrichmentService.enrichVehicleUpdateRequest(vehicleRequest);
		repository.update(vehicleRequest);

		if (vehicleRequest.getVehicle().getDriver() != null
				&& vehicleRequest.getVehicle().getDriver().getId() != null) {
			repository.updateDriver(vehicleRequest);
		}

		if (vehicleRequest.getVehicle().getFillingPoint() != null
				&& vehicleRequest.getVehicle().getFillingPoint().getId() != null) {
			repository.updateFillingPoint(vehicleRequest);
		}
		return vehicleRequest.getVehicle();
	}

	private void applyVehicleSearchRestriction(VehicleSearchCriteria criteria, RequestInfo requestInfo) {

		if (isEmployeeUser(requestInfo)) {
			return;
		}

		boolean isExactVehicleSearch =
				!CollectionUtils.isEmpty(criteria.getIds())
						|| !CollectionUtils.isEmpty(criteria.getRegistrationNumber());

		if (isExactVehicleSearch && isCitizenUser(requestInfo)) {
			return;
		}

		String vendorId = repository.getVendorIdByOwnerId(criteria.getVendorId());

		if (StringUtils.hasText(vendorId)
				&& repository.vendorVehicleMappingExists(vendorId)) {
			criteria.setVendorId(vendorId);

		}
		if (requestInfo == null || requestInfo.getUserInfo() == null) {
			throw new CustomException("AUTH_ERROR", "Invalid user session");
		}

		String userUuid = requestInfo.getUserInfo().getUuid();

		if (!org.springframework.util.StringUtils.hasLength(userUuid)) {
			throw new CustomException("AUTH_ERROR", "User UUID not found");
		}

		log.info("Applying vehicle restriction for user: {}", userUuid);

		List<String> vehicleIds = repository.fetchVehicleIdsByVendorOwner(userUuid);

		if (CollectionUtils.isEmpty(vehicleIds)) {
			criteria.setIds(Collections.singletonList("NO_DATA"));
			return;
		}

		if (CollectionUtils.isEmpty(criteria.getIds())) {
			criteria.setIds(vehicleIds);
		} else {
			criteria.getIds().retainAll(vehicleIds);
		}

		criteria.setMobileNumber(null);
	}

	private boolean isEmployeeUser(RequestInfo requestInfo) {
		if (requestInfo == null || requestInfo.getUserInfo() == null) {
			return false;
		}

		if (Constants.EMPLOYEE.equalsIgnoreCase(requestInfo.getUserInfo().getType())) {
			return true;
		}

		return !CollectionUtils.isEmpty(requestInfo.getUserInfo().getRoles()) &&
				requestInfo.getUserInfo().getRoles().stream()
						.map(Role::getCode)
						.anyMatch(role ->
								role.equalsIgnoreCase("EMPLOYEE") ||
										role.equalsIgnoreCase("SUPERUSER") ||
										role.equalsIgnoreCase("WT_CEMP"));
	}


	private boolean isCitizenUser(RequestInfo requestInfo) {

		if (requestInfo == null || requestInfo.getUserInfo() == null) {
			return false;
		}

		// User type must be CITIZEN
		if (Constants.CITIZEN.equalsIgnoreCase(requestInfo.getUserInfo().getType())) {
			return true;
		}

		// Role should contain WT_VENDOR
		return !CollectionUtils.isEmpty(requestInfo.getUserInfo().getRoles())
				&& requestInfo.getUserInfo().getRoles().stream()
				.map(Role::getCode)
				.anyMatch(role -> role.equalsIgnoreCase("WT_VENDOR"));
	}

	public VehicleResponse search(@Valid VehicleSearchCriteria criteria, RequestInfo requestInfo) {
		validator.validateSearch(requestInfo, criteria);
		applyVehicleSearchRestriction(criteria, requestInfo);
		UserDetailResponse usersRespnse;

		if (Boolean.TRUE.equals(criteria.getVehicleWithNoDriver())) {

			List<String> vehicleIds = repository.fetchVehicleIdsWithNoDriver(criteria);

			if (CollectionUtils.isEmpty(criteria.getIds())) {
				criteria.setIds(vehicleIds);
			} else {
				criteria.getIds().addAll(vehicleIds);
			}
		}
		if (criteria.isVehicleWithNoVendor()) {
			List<String> vehicleIds = repository.fetchVehicleIdsWithNoVendor(criteria);
			if (CollectionUtils.isEmpty(criteria.getIds())) {
				criteria.setIds(vehicleIds);
			} else {
				criteria.getIds().addAll(vehicleIds);
			}
		}

		if (criteria.getMobileNumber() != null) {
			usersRespnse = userService.getOwner(criteria, requestInfo);
			if (usersRespnse != null && usersRespnse.getUser() != null && !usersRespnse.getUser().isEmpty()) {
				List<String> uuids = usersRespnse.getUser().stream().map(User::getUuid).collect(Collectors.toList());
				if (CollectionUtils.isEmpty(criteria.getOwnerId())) {
					criteria.setOwnerId(uuids);
				} else {
					criteria.getOwnerId().addAll(uuids);
				}
			}
		}

		VehicleResponse response = repository.getVehicleData(criteria);

		if (!response.getVehicle().isEmpty()) {
			enrichmentService.enrichSearchData(response.getVehicle(), requestInfo);
		}
		return response;
	}

	public List<Vehicle> vehiclePlainSearch(@Valid VehicleSearchCriteria criteria) {
		return getVehiclePlainSearch(criteria);
	}

	private List<Vehicle> getVehiclePlainSearch(@Valid VehicleSearchCriteria criteria) {
		if (criteria.getLimit() != null && criteria.getLimit() > config.getMaxSearchLimit())
			criteria.setLimit(config.getMaxSearchLimit());

		List<String> ids = null;

		if (criteria.getIds() != null && !criteria.getIds().isEmpty())
			ids = criteria.getIds();
		else
			ids = repository.fetchVehicleIds(criteria);

		if (ids.isEmpty())
			return Collections.emptyList();

		VehicleSearchCriteria vehiclecriteria = VehicleSearchCriteria.builder().ids(ids).build();

		return repository.getVehiclePlainSearch(vehiclecriteria);
	}

}
