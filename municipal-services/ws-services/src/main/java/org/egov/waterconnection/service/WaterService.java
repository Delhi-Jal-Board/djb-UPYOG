package org.egov.waterconnection.service;

import java.util.List;

import org.egov.common.contract.request.RequestInfo;
import org.egov.waterconnection.web.models.*;

public interface WaterService {

	List<WaterConnection> createWaterConnection(WaterConnectionRequest waterConnectionRequest);

	List<WaterConnection> search(SearchCriteria criteria, RequestInfo requestInfo);

	Integer countAllWaterApplications(SearchCriteria criteria, RequestInfo requestInfo);

	List<WaterConnection> updateWaterConnection(WaterConnectionRequest waterConnectionRequest);

	WaterConnectionResponse plainSearch(SearchCriteria criteria, RequestInfo requestInfo);

	DueVerification fetchDueVerification(DueVerificationRequest dueVerificationRequest);

}