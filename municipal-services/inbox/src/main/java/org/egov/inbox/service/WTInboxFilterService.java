package org.egov.inbox.service;

import static org.egov.inbox.util.RequestServiceConstants.ASSIGNEE_PARAM;
import static org.egov.inbox.util.RequestServiceConstants.BOOKING_NO_PARAM;
import static org.egov.inbox.util.RequestServiceConstants.BUSINESS_SERVICE_PARAM;
import static org.egov.inbox.util.RequestServiceConstants.DESC_PARAM;
import static org.egov.inbox.util.RequestServiceConstants.LOCALITY_PARAM;
import static org.egov.inbox.util.RequestServiceConstants.MOBILE_NUMBER_PARAM;
import static org.egov.inbox.util.RequestServiceConstants.REQUESTINFO_PARAM;
import static org.egov.inbox.util.RequestServiceConstants.SEARCH_CRITERIA_PARAM;
import static org.egov.inbox.util.RequestServiceConstants.SORT_ORDER_PARAM;
import static org.egov.inbox.util.RequestServiceConstants.STATUS_PARAM;
import static org.egov.inbox.util.RequestServiceConstants.TENANT_ID_PARAM;
import static org.egov.inbox.util.RequestServiceConstants.USERID_PARAM;
import static org.egov.inbox.util.RequestServiceConstants.OFFSET_PARAM;
import static org.egov.inbox.util.RequestServiceConstants.NO_OF_RECORDS_PARAM;
import static org.egov.inbox.util.RequestServiceConstants.LIMIT_PARAM;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.egov.common.contract.request.RequestInfo;
import org.egov.inbox.repository.ServiceRequestRepository;
import org.egov.inbox.web.model.InboxSearchCriteria;
import org.egov.inbox.web.model.workflow.ProcessInstanceSearchCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.ObjectUtils;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.core.JsonGenerationException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service

/**
 * Fetches the application numbers from the searcher service based on the provided search criteria.
 * 
 * This method constructs the search request by filtering the search criteria like tenantId, businessService, 
 * assignee, status, mobileNumber, booking number, and locality, and sends a request to the searcher service 
 * to fetch matching application numbers. It handles pagination and sorting of the results and also checks 
 * if a mobile number is provided, in which case it fetches the corresponding user UUIDs.
 * 
 * If no mobile number is provided or if no user exists for the given mobile number, it returns an empty list. 
 * 
 * @param criteria - The search criteria containing filters like tenantId, businessService, status, etc.
 * @param StatusIdNameMap - A map that holds status ID and name mappings.
 * @param requestInfo - The request metadata containing information like api_id, ts, etc.
 * @return List<String> - A list of application numbers (booking numbers) retrieved from the searcher service.
 */

public class WTInboxFilterService {

		@Value("${egov.user.host}")
		private String userHost;

		@Value("${egov.user.search.path}")
		private String userSearchEndpoint;

		@Value("${egov.searcher.host}")
		private String searcherHost;

		@Value("${egov.searcher.wt.search.path}")
		private String wtInboxSearcherEndpoint;

		@Value("${egov.searcher.wt.search.desc.path}")
		private String wtInboxSearcherDescEndpoint;

		@Value("${egov.searcher.wtf.search.desc.path}")
		private String wtFixedPointInboxSearcherDescEndpoint;

	@Value("${egov.requestservice.host}")
	private String requestServiceHost;

	@Value("${egov.requestservice.search.path}")
	private String requestServiceSearchEndpoint;

		@Autowired
		private RestTemplate restTemplate;

		@Autowired
		private ObjectMapper mapper;

		@Autowired
		private ServiceRequestRepository serviceRequestRepository;

		/**
		 * Fetches application numbers from the searcher service based on the provided search criteria.
		 * It accommodates both module-specific and process-specific search parameters and integrates
		 * user UUIDs if the mobile number is present in the search criteria.
		 *
		 * @param criteria          The inbox search criteria containing module and process-specific filters.
		 * @param StatusIdNameMap   A map of status IDs to their corresponding status names.
		 * @param requestInfo       The RequestInfo object containing metadata for the request.
		 * @return A list of application numbers matching the search criteria, or an empty list if no results are found.
		 */

		public List<String> fetchApplicationNumbersFromSearcher(
				InboxSearchCriteria criteria,
				HashMap<String, String> statusIdNameMap,
				RequestInfo requestInfo) {

			List<String> applicationNumbers = new ArrayList<>();

			HashMap moduleSearchCriteria = criteria.getModuleSearchCriteria();
			ProcessInstanceSearchCriteria processCriteria = criteria.getProcessSearchCriteria();

			Map<String, Object> searcherRequest = new HashMap<>();
			Map<String, Object> searchCriteria = new HashMap<>();

			searchCriteria.put(TENANT_ID_PARAM, criteria.getTenantId());
			searchCriteria.put(BUSINESS_SERVICE_PARAM, processCriteria.getBusinessService());

			Object mobile = moduleSearchCriteria.get(MOBILE_NUMBER_PARAM);
			Object bookingNo = moduleSearchCriteria.get(BOOKING_NO_PARAM);

			String mobileStr = (mobile != null && !mobile.toString().trim().isEmpty())
					? mobile.toString()
					: " ";

			String bookingStr = (bookingNo != null && !bookingNo.toString().trim().isEmpty())
					? bookingNo.toString()
					: " ";

			searchCriteria.put(MOBILE_NUMBER_PARAM, mobileStr);
			searchCriteria.put(BOOKING_NO_PARAM, bookingStr);


              // ADD DATE FILTER ONLY FOR FIXED POINT
			if (processCriteria.getBusinessService().contains("watertanker-fixedpoint")) {


				Object fromDateObj = moduleSearchCriteria.get("fromDate");
				Object toDateObj = moduleSearchCriteria.get("toDate");

				String fromDateStr = (fromDateObj != null && !fromDateObj.toString().trim().isEmpty())
						? fromDateObj.toString()
						: " ";

				String toDateStr = (toDateObj != null && !toDateObj.toString().trim().isEmpty())
						? toDateObj.toString()
						: " ";

				searchCriteria.put("fromDate", fromDateStr);
				searchCriteria.put("toDate", toDateStr);

			}

			if (moduleSearchCriteria.containsKey(LOCALITY_PARAM)) {
				searchCriteria.put(LOCALITY_PARAM, moduleSearchCriteria.get(LOCALITY_PARAM));
			}

			if (!ObjectUtils.isEmpty(processCriteria.getAssignee())) {
				searchCriteria.put(ASSIGNEE_PARAM, processCriteria.getAssignee());
			}

			if (!ObjectUtils.isEmpty(processCriteria.getStatus())) {
				searchCriteria.put(STATUS_PARAM, processCriteria.getStatus());
			} else if (!statusIdNameMap.isEmpty()) {
				searchCriteria.put(STATUS_PARAM, statusIdNameMap.keySet());
			}

			searchCriteria.put(NO_OF_RECORDS_PARAM, criteria.getLimit());
			searchCriteria.put(OFFSET_PARAM, criteria.getOffset());

			searcherRequest.put(REQUESTINFO_PARAM, requestInfo);
			searcherRequest.put(SEARCH_CRITERIA_PARAM, searchCriteria);

			log.info("FINAL SEARCH REQUEST: " + searcherRequest);

			StringBuilder uri = new StringBuilder();


			if (processCriteria.getBusinessService().contains("watertanker-fixedpoint")) {

				// fixed point endpoint
				uri.append(searcherHost).append(wtFixedPointInboxSearcherDescEndpoint);

			} else {
				if (moduleSearchCriteria.containsKey(SORT_ORDER_PARAM)
						&& DESC_PARAM.equals(moduleSearchCriteria.get(SORT_ORDER_PARAM))) {
					uri.append(searcherHost).append(wtInboxSearcherDescEndpoint);
				} else {
					uri.append(searcherHost).append(wtInboxSearcherEndpoint);
				}
			}


			Map result = restTemplate.postForObject(uri.toString(), searcherRequest, Map.class);

			log.info("Searcher Response: " + result);

			ObjectMapper mapper = new ObjectMapper();
			try {
				String jsonString = mapper.writeValueAsString(result);
				applicationNumbers = JsonPath.read(jsonString,
						"$.waterTankerBookingDetail[*].booking_no");

			} catch (Exception e) {
				log.error("Error parsing response", e);
			}

			log.info("APPLICATION NUMBERS SIZE: " + applicationNumbers.size());

			return applicationNumbers;
		}

		/**
		 * Fetches a list of user UUIDs for the given mobile number, tenant ID, and RequestInfo.
		 * Utilizes a service request to retrieve user details from the user service.
		 *
		 * @param mobileNumber The mobile number of the user.
		 * @param requestInfo  The RequestInfo object containing metadata for the request.
		 * @param tenantId     The tenant ID for the user search.
		 * @return A list of UUIDs of the users matching the search criteria.
		 */

		private List<String> fetchUserUUID(String mobileNumber, RequestInfo requestInfo, String tenantId) {
			StringBuilder uri = new StringBuilder();
			uri.append(userHost).append(userSearchEndpoint);
			Map<String, Object> userSearchRequest = new HashMap<>();
			userSearchRequest.put("RequestInfo", requestInfo);
			userSearchRequest.put("tenantId", tenantId);
			userSearchRequest.put("userType", "CITIZEN");
			userSearchRequest.put("mobileNumber", mobileNumber);
			List<String> userUuids = new ArrayList<>();
			try {
				Object user = serviceRequestRepository.fetchResult(uri, userSearchRequest);
				if (null != user) {
					// log.info(user.toString());
					userUuids = JsonPath.read(user, "$.user.*.uuid");
				} else {
					log.error("Service returned null while fetching user for mobile number - " + mobileNumber);
				}
			} catch (Exception e) {
				log.error("Exception while fetching user for mobile number - " + mobileNumber);
				log.error("Exception trace: ", e);
			}
			return userUuids;
		}

	public Map<String, Integer> fetchStatusCounts(InboxSearchCriteria criteria, RequestInfo requestInfo) {

		Map<String, Integer> statusCounts = new HashMap<>();

		try {
			ProcessInstanceSearchCriteria processCriteria = criteria.getProcessSearchCriteria();
			HashMap moduleSearchCriteria = criteria.getModuleSearchCriteria();

			// 1. Build the Search URL
			StringBuilder url = new StringBuilder(requestServiceHost + requestServiceSearchEndpoint);
			url.append("?tenantId=").append(criteria.getTenantId());

			// Map the business service to applicationType
			if (processCriteria.getBusinessService() != null) {
				url.append("&applicationType=").append(processCriteria.getBusinessService());
			}

			// Append other filters if they exist (mobileNumber, locality, etc.)
			if (moduleSearchCriteria != null) {
				if (moduleSearchCriteria.containsKey(MOBILE_NUMBER_PARAM) && moduleSearchCriteria.get(MOBILE_NUMBER_PARAM) != null) {
					url.append("&mobileNumber=").append(moduleSearchCriteria.get(MOBILE_NUMBER_PARAM));
				}
				if (moduleSearchCriteria.containsKey(LOCALITY_PARAM) && moduleSearchCriteria.get(LOCALITY_PARAM) != null) {
					url.append("&localityCode=").append(moduleSearchCriteria.get(LOCALITY_PARAM));
				}
			}

			// We only need the counts, limit=1 makes it fast
			url.append("&limit=1");

			// 2. Build the Payload
			Map<String, Object> request = new HashMap<>();
			request.put("RequestInfo", requestInfo);

			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);
			HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

			// 3. Make the API Call
			log.info("Fetching status counts from Request Service: {}", url.toString());
			ResponseEntity<Map> response = restTemplate.postForEntity(url.toString(), entity, Map.class);

			if (response.getBody() != null && response.getBody().containsKey("statusCounts")) {
				statusCounts = (Map<String, Integer>) response.getBody().get("statusCounts");
			}

		} catch (Exception e) {
			log.error("Failed to fetch status counts from request-service", e);
		}

		return statusCounts;
	}

}
