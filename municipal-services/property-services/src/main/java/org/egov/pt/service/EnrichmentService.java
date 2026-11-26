package org.egov.pt.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.egov.common.contract.request.RequestInfo;
import org.egov.pt.config.PropertyConfiguration;
import org.egov.pt.models.AuditDetails;
import org.egov.pt.models.Institution;
import org.egov.pt.models.OwnerInfo;
import org.egov.pt.models.Property;
import org.egov.pt.models.PropertyCriteria;
import org.egov.pt.models.WaterConnectionDetails;
import org.egov.pt.models.enums.Status;
import org.egov.pt.models.user.User;
import org.egov.pt.repository.ServiceRequestRepository;
import org.egov.pt.util.PTConstants;
import org.egov.pt.util.PropertyUtil;
import org.egov.pt.web.contracts.PropertyRequest;
import org.egov.pt.web.contracts.RequestInfoWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class EnrichmentService {


    @Autowired
    private PropertyUtil propertyutil;

    @Autowired
    private BoundaryService boundaryService;

    @Autowired
    private PropertyConfiguration config;

	@Autowired
	private UserService userService;

	@Autowired
	private ServiceRequestRepository serviceRequestRepository;



    /**
     * Assigns UUIDs to all id fields and also assigns acknowledgement-number and assessment-number generated from id-gen
     * @param request  PropertyRequest received for property creation
     */
	public void enrichCreateRequest(PropertyRequest request) {

		RequestInfo requestInfo = request.getRequestInfo();
		Property property = request.getProperty();
		
		property.setAccountId(requestInfo.getUserInfo().getUuid());
		enrichUuidsForPropertyCreate(requestInfo, property);
		setIdgenIds(request);
		enrichBoundary(property, requestInfo);
	}

	private void enrichUuidsForPropertyCreate(RequestInfo requestInfo, Property property) {
		
		AuditDetails propertyAuditDetails = propertyutil.getAuditDetails(requestInfo.getUserInfo().getUuid(), true);
		
		property.setId(UUID.randomUUID().toString());
		
		if (!CollectionUtils.isEmpty(property.getDocuments()))
			property.getDocuments().forEach(doc -> {
				doc.setId(UUID.randomUUID().toString());
				doc.setStatus(Status.ACTIVE);
			});

		property.getAddress().setTenantId(property.getTenantId());
		property.getAddress().setId(UUID.randomUUID().toString());

		if (!ObjectUtils.isEmpty(property.getInstitution()))
			property.getInstitution().setId(UUID.randomUUID().toString());

		property.setAuditDetails(propertyAuditDetails);
		
		if (!CollectionUtils.isEmpty(property.getUnits()))
			property.getUnits().forEach(unit -> {

				unit.setId(UUID.randomUUID().toString());
				unit.setActive(true);
			});
		
		property.getOwners().forEach(owner -> {
			
			owner.setOwnerInfoUuid(UUID.randomUUID().toString());
			if (!CollectionUtils.isEmpty(owner.getDocuments()))
				owner.getDocuments().forEach(doc -> {
					doc.setId(UUID.randomUUID().toString());
					doc.setStatus(Status.ACTIVE);
				});
			
			owner.setStatus(Status.ACTIVE);
		});
	}

    /**
     * Assigns UUID for new fields that are added and sets propertyDetail and address id from propertyId
     * 
     * @param request  PropertyRequest received for property update
     * @param propertyFromDb Properties returned from DB
     */
    public void enrichUpdateRequest(PropertyRequest request,Property propertyFromDb) {
    	
    	Property property = request.getProperty();
        RequestInfo requestInfo = request.getRequestInfo();
        AuditDetails auditDetailsForUpdate = propertyutil.getAuditDetails(requestInfo.getUserInfo().getUuid().toString(), true);
        propertyFromDb.setAuditDetails(auditDetailsForUpdate);
        
        
		Boolean isWfEnabled = config.getIsWorkflowEnabled();
		Boolean iswfStarting = propertyFromDb.getStatus().equals(Status.ACTIVE);

		if (!isWfEnabled) {

			property.setStatus(Status.ACTIVE);
			property.getAddress().setId(propertyFromDb.getAddress().getId());

		}  else if (isWfEnabled && iswfStarting) {

           String ackNo = propertyutil.getIdList(requestInfo, property.getTenantId(),
            config.getAckIdGenName(), config.getAckIdGenFormat(), 1).get(0);
            property.setAcknowldgementNumber(ackNo);

             property.setId(propertyFromDb.getId());
             property.getAddress().setId(propertyFromDb.getAddress().getId());

             property.getOwners().forEach(owner -> {
             propertyFromDb.getOwners().stream()
            .filter(oldOwner -> oldOwner.getUuid() != null && oldOwner.getUuid().equals(owner.getUuid()))
            .findFirst()
            .ifPresent(oldOwner -> owner.setOwnerInfoUuid(oldOwner.getOwnerInfoUuid()));
    });
}
		
		if (!CollectionUtils.isEmpty(property.getDocuments()))
			property.getDocuments().forEach(doc -> {

				if (doc.getId() == null) {
					doc.setId(UUID.randomUUID().toString());
					doc.setStatus(Status.ACTIVE);
				}
			});
				
	    	if (!CollectionUtils.isEmpty(property.getUnits()))
			property.getUnits().forEach(unit -> {

				if (unit.getId() == null) {
					unit.setId(UUID.randomUUID().toString());
					unit.setActive(true);
				}
			});
				
		Institution institute = property.getInstitution();
		if (!ObjectUtils.isEmpty(institute) && null == institute.getId())
			property.getInstitution().setId(UUID.randomUUID().toString());

		AuditDetails auditDetails = propertyutil.getAuditDetails(requestInfo.getUserInfo().getUuid().toString(), true);
		property.setAuditDetails(auditDetails);
		property.setAccountId(propertyFromDb.getAccountId());
       
		property.setAdditionalDetails(
				propertyutil.jsonMerge(propertyFromDb.getAdditionalDetails(), property.getAdditionalDetails()));
    }



    /**
	 * Sets the acknowledgement and assessment Numbers for given PropertyRequest
	 * 
	 * @param request PropertyRequest which is to be created
	 */
	private void setIdgenIds(PropertyRequest request) {

		Property property = request.getProperty();
		String tenantId = property.getTenantId();
		RequestInfo requestInfo = request.getRequestInfo();

		if (!config.getIsWorkflowEnabled()) {

			property.setStatus(Status.ACTIVE);
		}
		
		String pId = propertyutil.getIdList(requestInfo, tenantId, config.getPropertyIdGenName(), config.getPropertyIdGenFormat(), 1).get(0);
		String ackNo = propertyutil.getIdList(requestInfo, tenantId, config.getAckIdGenName(), config.getAckIdGenFormat(), 1).get(0);
		property.setPropertyId(pId);
		property.setAcknowldgementNumber(ackNo);
	}


    /**
     * Returns PropertyCriteria with ids populated using propertyids from properties
     * @param properties properties whose propertyids are to added to propertyCriteria for search
     * @return propertyCriteria to search on basis of propertyids
     */
	public PropertyCriteria getPropertyCriteriaFromPropertyIds(List<Property> properties) {

		PropertyCriteria criteria = new PropertyCriteria();
		Set<String> propertyids = new HashSet<>();
		properties.forEach(property -> propertyids.add(property.getPropertyId()));
		criteria.setPropertyIds(propertyids);
		criteria.setTenantId(properties.get(0).getTenantId());
		return criteria;
	}

    /**
     *  Enriches the locality object
     * @param property The property object received for create or update
     */
    public void enrichBoundary(Property property, RequestInfo requestInfo){
    	
        boundaryService.getAreaType(property, requestInfo, PTConstants.BOUNDARY_HEIRARCHY_CODE);
    }
    
    /**
     * 
     * Enrichment method for mutation request
     * 
     * @param request
     */
	public void enrichMutationRequest(PropertyRequest request, Property propertyFromSearch) {

		RequestInfo requestInfo = request.getRequestInfo();
		Property property = request.getProperty();
		Boolean isWfEnabled = config.getIsMutationWorkflowEnabled();
		Boolean iswfStarting = propertyFromSearch.getStatus().equals(Status.ACTIVE);
		AuditDetails auditDetailsForUpdate = propertyutil.getAuditDetails(requestInfo.getUserInfo().getUuid().toString(), true);
		propertyFromSearch.setAuditDetails(auditDetailsForUpdate);

		if (!isWfEnabled) {

			property.setStatus(Status.ACTIVE);

		} else if (isWfEnabled && iswfStarting) {

			enrichPropertyForNewWf(requestInfo, property, true);
		}

		property.getOwners().forEach(owner -> {

			if (owner.getOwnerInfoUuid() == null) {
				
				owner.setOwnerInfoUuid(UUID.randomUUID().toString());
				owner.setStatus(Status.ACTIVE);
			}

			if (!CollectionUtils.isEmpty(owner.getDocuments()))
				owner.getDocuments().forEach(doc -> {
					if (doc.getId() == null) {
						doc.setId(UUID.randomUUID().toString());
						doc.setStatus(Status.ACTIVE);
					}
				});
		});
		 AuditDetails auditDetails = propertyutil.getAuditDetails(requestInfo.getUserInfo().getUuid().toString(), true);
		 property.setAuditDetails(auditDetails);
	}

	/**
	 * enrich property as new entry for workflow validation
	 * 
	 * @param requestInfo
	 * @param property
	 */
	private void enrichPropertyForNewWf(RequestInfo requestInfo, Property property, Boolean isMutation) {
		
		String ackNo;

		if (isMutation) {
			ackNo = propertyutil.getIdList(requestInfo, property.getTenantId(), config.getMutationIdGenName(), config.getMutationIdGenFormat(), 1).get(0);
		} else
			ackNo = propertyutil.getIdList(requestInfo, property.getTenantId(), config.getAckIdGenName(), config.getAckIdGenFormat(), 1).get(0);
		property.setId(UUID.randomUUID().toString());
		property.setAcknowldgementNumber(ackNo);
		
		enrichUuidsForNewUpdate(requestInfo, property);
	}
	
	private void enrichUuidsForNewUpdate(RequestInfo requestInfo, Property property) {
		
		AuditDetails propertyAuditDetails = propertyutil.getAuditDetails(requestInfo.getUserInfo().getUuid(), true);
		
		property.setId(UUID.randomUUID().toString());
		
		if (!CollectionUtils.isEmpty(property.getDocuments()))
			property.getDocuments().forEach(doc -> {
				doc.setId(UUID.randomUUID().toString());
				if (null == doc.getStatus())
					doc.setStatus(Status.ACTIVE);
			});

		property.getAddress().setTenantId(property.getTenantId());
		property.getAddress().setId(UUID.randomUUID().toString());

		if (!ObjectUtils.isEmpty(property.getInstitution()))
			property.getInstitution().setId(UUID.randomUUID().toString());

		property.setAuditDetails(propertyAuditDetails);
		
		if (!CollectionUtils.isEmpty(property.getUnits()))
			property.getUnits().forEach(unit -> {

				unit.setId(UUID.randomUUID().toString());
				unit.setActive(true);
			});
		
		property.getOwners().forEach(owner -> {
			
			owner.setOwnerInfoUuid(UUID.randomUUID().toString());
			if (!CollectionUtils.isEmpty(owner.getDocuments()))
				owner.getDocuments().forEach(doc -> {
					doc.setId(UUID.randomUUID().toString());
					if (null == doc.getStatus())
						doc.setStatus(Status.ACTIVE);
				});
			if (null == owner.getStatus())
				owner.setStatus(Status.ACTIVE);
		});
	}
	
    /**
     * In case of SENDBACKTOCITIZEN enrich the assignee with the owners and creator of property
     * @param property to be enriched
     */
    public void enrichAssignes(Property property){

            if(config.getIsWorkflowEnabled() && property.getWorkflow().getAction().equalsIgnoreCase(PTConstants.CITIZEN_SENDBACK_ACTION)){

                    List<OwnerInfo> assignes = new LinkedList<>();

                    // Adding owners to assignes list
                    property.getOwners().forEach(ownerInfo -> {
                       assignes.add(ownerInfo);
                    });

                    // Adding creator of application
                    if(property.getAccountId()!=null)
                        assignes.add(OwnerInfo.builder().uuid(property.getAccountId()).build());

					Set<OwnerInfo> registeredUsers = userService.getUUidFromUserName(property);

					if(!CollectionUtils.isEmpty(registeredUsers))
						assignes.addAll(registeredUsers);

                    property.getWorkflow().setAssignes(assignes);
            }
    }

	/**
	 * Enriches water connection details for a list of properties by querying ws-services.
	 * Supports the 'One Property One Water Connection' business rule.
	 *
	 * @param properties list of properties to enrich
	 * @param requestInfo caller requestInfo
	 */
	public void enrichWaterConnectionDetails(List<Property> properties, RequestInfo requestInfo) {
		if (CollectionUtils.isEmpty(properties)) {
			return;
		}

		// Initialize default NOT_APPLIED for all properties first (fail-safe)
		for (Property property : properties) {
			if (property != null && property.getWaterConnectionDetails() == null) {
				property.setWaterConnectionDetails(getDefaultNotAppliedDetails());
			}
		}

		// Group properties by tenantId
		Map<String, List<Property>> tenantPropertyMap = properties.stream()
				.filter(p -> p != null && !StringUtils.isEmpty(p.getPropertyId()) && !StringUtils.isEmpty(p.getTenantId()))
				.collect(Collectors.groupingBy(Property::getTenantId));

		for (Map.Entry<String, List<Property>> entry : tenantPropertyMap.entrySet()) {
			String tenantId = entry.getKey();
			List<Property> propList = entry.getValue();

			try {
				enrichWaterConnectionsForTenant(tenantId, propList, requestInfo);
			} catch (Exception e) {
				log.error("Error while enriching water connection details for tenant {}: {}", tenantId, e.getMessage(), e);
				// Do not throw exception, keep default NOT_APPLIED so property search never fails
			}
		}
	}

	private void enrichWaterConnectionsForTenant(String tenantId, List<Property> propList, RequestInfo requestInfo) {
		int batchSize = 30;
		for (int i = 0; i < propList.size(); i += batchSize) {
			List<Property> batch = propList.subList(i, Math.min(i + batchSize, propList.size()));
			enrichWaterConnectionsBatch(tenantId, batch, requestInfo);
		}
	}

	private void enrichWaterConnectionsBatch(String tenantId, List<Property> batch, RequestInfo requestInfo) {
		String propertyIdsJoined = batch.stream()
				.map(Property::getPropertyId)
				.collect(Collectors.joining(","));

		String callerUuid = (requestInfo != null && requestInfo.getUserInfo() != null
				&& !StringUtils.isEmpty(requestInfo.getUserInfo().getUuid()))
						? requestInfo.getUserInfo().getUuid()
						: "SYSTEM";
		org.egov.common.contract.request.User internalUser = org.egov.common.contract.request.User.builder()
				.uuid(callerUuid)
				.type("SYSTEM")
				.tenantId(tenantId)
				.roles(Collections.emptyList())
				.build();
		RequestInfo internalRequestInfo = RequestInfo.builder()
				.apiId(requestInfo != null ? requestInfo.getApiId() : null)
				.ver(requestInfo != null ? requestInfo.getVer() : null)
				.ts(requestInfo != null ? requestInfo.getTs() : null)
				.action(requestInfo != null ? requestInfo.getAction() : null)
				.did(requestInfo != null ? requestInfo.getDid() : null)
				.key(requestInfo != null ? requestInfo.getKey() : null)
				.msgId(requestInfo != null ? requestInfo.getMsgId() : null)
				.authToken(requestInfo != null ? requestInfo.getAuthToken() : null)
				.correlationId(requestInfo != null ? requestInfo.getCorrelationId() : null)
				.userInfo(internalUser)
				.build();

		StringBuilder uri = new StringBuilder(config.getWsHost())
				.append(config.getWsSearchEndpoint())
				.append("?tenantId=").append(tenantId)
				.append("&propertyIds=").append(propertyIdsJoined)
				.append("&searchType=APPLICATION")
				.append("&isInternalCall=true");

		try {
			Optional<Object> response = serviceRequestRepository.fetchResult(uri,
					RequestInfoWrapper.builder().requestInfo(internalRequestInfo).build());
			if (!response.isPresent()) {
				return;
			}

			Map<String, Object> responseMap = (Map<String, Object>) response.get();
			List<Map<String, Object>> connections = (List<Map<String, Object>>) responseMap.get("WaterConnection");
			if (CollectionUtils.isEmpty(connections)) {
				return;
			}

			// Group returned connections by propertyId
			Map<String, List<Map<String, Object>>> propConnectionsMap = new HashMap<>();
			for (Map<String, Object> conn : connections) {
				if (conn == null) continue;
				String propId = conn.get("propertyId") != null ? String.valueOf(conn.get("propertyId")).trim() : null;
				if (!StringUtils.isEmpty(propId)) {
					propConnectionsMap.computeIfAbsent(propId, k -> new ArrayList<>()).add(conn);
				}
			}

			// Evaluate water connection details for each property in this batch
			for (Property property : batch) {
				List<Map<String, Object>> connList = propConnectionsMap.get(property.getPropertyId());
				if (!CollectionUtils.isEmpty(connList)) {
					WaterConnectionDetails details = evaluateWaterConnectionDetails(connList);
					if (details != null) {
						property.setWaterConnectionDetails(details);
					}
				}
			}
		} catch (Exception e) {
			log.error("Failed to fetch water connections for propertyIds [{}]: {}", propertyIdsJoined, e.getMessage(), e);
		}
	}

	private WaterConnectionDetails evaluateWaterConnectionDetails(List<Map<String, Object>> connList) {
		Map<String, Object> newConnActivatedMatch = null;
		Map<String, Object> newConnInProgressMatch = null;
		Map<String, Object> anyConnectionWithNoMatch = null;

		for (Map<String, Object> conn : connList) {
			if (conn == null) continue;

			String appType = conn.get("applicationType") != null
					? String.valueOf(conn.get("applicationType")).trim()
					: null;
			String appStatus = conn.get("applicationStatus") != null
					? String.valueOf(conn.get("applicationStatus")).trim()
					: null;
			if (StringUtils.isEmpty(appStatus) && conn.get("status") != null) {
				appStatus = String.valueOf(conn.get("status")).trim();
			}
			String rawConnNo = conn.get("connectionNo") != null
					? String.valueOf(conn.get("connectionNo")).trim()
					: null;
			String connNo = (!StringUtils.isEmpty(rawConnNo) && !"null".equalsIgnoreCase(rawConnNo))
					? rawConnNo
					: null;

			if (connNo != null && anyConnectionWithNoMatch == null) {
				anyConnectionWithNoMatch = conn;
			}

			boolean isNewConn = StringUtils.isEmpty(appType)
					|| "NEW_WATER_CONNECTION".equalsIgnoreCase(appType);

			if (isNewConn) {
				boolean isConnectionActivated = "CONNECTION_ACTIVATED".equalsIgnoreCase(appStatus)
						|| "APPROVED".equalsIgnoreCase(appStatus);

				if (connNo != null || isConnectionActivated) {
					if (newConnActivatedMatch == null) {
						newConnActivatedMatch = conn;
					}
				} else {
					boolean isTerminated = "REJECTED".equalsIgnoreCase(appStatus)
							|| "CANCELLED".equalsIgnoreCase(appStatus);
					if (!isTerminated && newConnInProgressMatch == null) {
						newConnInProgressMatch = conn;
					}
				}
			}
		}

		// Priority 1: A NEW_WATER_CONNECTION that has a connectionNo or is ACTIVATED/APPROVED
		if (newConnActivatedMatch != null) {
			WaterConnectionDetails details = buildConnectionDetails("CONNECTION_EXISTS", true, true, false,
					newConnActivatedMatch, "Water connection already exists for this property.");
			// If connectionNo is missing on the new connection row, take it from any record that has it
			if (StringUtils.isEmpty(details.getConnectionNo()) && anyConnectionWithNoMatch != null) {
				String rawConnNo = anyConnectionWithNoMatch.get("connectionNo") != null
						? String.valueOf(anyConnectionWithNoMatch.get("connectionNo")).trim()
						: null;
				if (!StringUtils.isEmpty(rawConnNo) && !"null".equalsIgnoreCase(rawConnNo)) {
					details.setConnectionNo(rawConnNo);
				}
			}
			return details;
		}

		// Priority 2: Any other record having a valid connectionNo (e.g. legacy/service record when NEW_WATER_CONNECTION row is missing)
		if (anyConnectionWithNoMatch != null) {
			return buildConnectionDetails("CONNECTION_EXISTS", true, true, false,
					anyConnectionWithNoMatch, "Water connection already exists for this property.");
		}

		// Priority 3: A NEW_WATER_CONNECTION that is in progress (not terminated)
		if (newConnInProgressMatch != null) {
			return buildConnectionDetails("APPLICATION_IN_PROGRESS", false, true, false,
					newConnInProgressMatch, "A water connection application is already in progress for this property.");
		}

		return getDefaultNotAppliedDetails();
	}

	private WaterConnectionDetails buildConnectionDetails(String status, boolean hasWaterConnection,
			boolean hasExistingApplication, boolean canApply, Map<String, Object> conn, String message) {
		String appNo = conn.get("applicationNo") != null
				? String.valueOf(conn.get("applicationNo")).trim()
				: null;
		String appStatus = conn.get("applicationStatus") != null
				? String.valueOf(conn.get("applicationStatus")).trim()
				: null;
		if (StringUtils.isEmpty(appStatus) && conn.get("status") != null) {
			appStatus = String.valueOf(conn.get("status")).trim();
		}
		String rawConnNo = conn.get("connectionNo") != null
				? String.valueOf(conn.get("connectionNo")).trim()
				: null;
		String connNo = (!StringUtils.isEmpty(rawConnNo) && !"null".equalsIgnoreCase(rawConnNo))
				? rawConnNo
				: null;

		return WaterConnectionDetails.builder()
				.status(status)
				.hasWaterConnection(hasWaterConnection)
				.hasExistingApplication(hasExistingApplication)
				.applicationNo(appNo)
				.applicationStatus(appStatus)
				.connectionNo(connNo)
				.canApply(canApply)
				.message(message)
				.build();
	}

	private WaterConnectionDetails getDefaultNotAppliedDetails() {
		return WaterConnectionDetails.builder()
				.status("NOT_APPLIED")
				.hasWaterConnection(false)
				.hasExistingApplication(false)
				.applicationNo(null)
				.applicationStatus(null)
				.connectionNo(null)
				.canApply(true)
				.message("No existing water connection or application found for this property.")
				.build();
	}


}
