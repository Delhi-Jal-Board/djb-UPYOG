package org.egov.waterconnection.repository;

import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.exception.InvalidTenantIdException;
import org.egov.common.utils.MultiStateInstanceUtil;
import org.egov.tracer.model.CustomException;
import org.egov.waterconnection.web.models.Document;
import org.egov.waterconnection.web.models.InspectionInformation;
import org.postgresql.util.PGobject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.util.CollectionUtils;

@Slf4j
@Repository
public class SiteInspectionRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private MultiStateInstanceUtil multiStateInstanceUtil;

    @Autowired
    private ObjectMapper mapper;

    private String schemaSql(String sql, String tenantId) {
        try {
            return multiStateInstanceUtil.replaceSchemaPlaceholder(sql, tenantId);
        } catch (InvalidTenantIdException e) {
            throw new CustomException("WS_SITE_INSPECTION_SCHEMA_ERROR",
                    "Unable to resolve database schema for site inspection: " + e.getMessage());
        }
    }

    /**
     * Upserts inspection details into {schema}.eg_ws_inspection_information
     */
    public void upsertInspectionInformation(String tenantId, String applicationNo, InspectionInformation inspectionInfo, RequestInfo requestInfo) {
        if (inspectionInfo == null || StringUtils.isEmpty(applicationNo)) {
            return;
        }

        String inspectionType = inspectionInfo.getInspectionType() != null ? inspectionInfo.getInspectionType().getCode() : "SITE_INSPECTION";
        Long inspectionDate = inspectionInfo.getInspectionDate() != null ? inspectionInfo.getInspectionDate() : System.currentTimeMillis();
        String inspectorName = inspectionInfo.getInspectorName();
        if (StringUtils.isEmpty(inspectorName) && requestInfo != null && requestInfo.getUserInfo() != null) {
            inspectorName = requestInfo.getUserInfo().getName();
        }

        String userId = (requestInfo != null && requestInfo.getUserInfo() != null) ? requestInfo.getUserInfo().getUuid() : "SYSTEM";
        long now = System.currentTimeMillis();

        String sql = schemaSql(
                "INSERT INTO {schema}.eg_ws_inspection_information " +
                "(applicationno, inspection_type, inspection_date, inspector_name, createdby, createdtime, lastmodifiedby, lastmodifiedtime) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                "ON CONFLICT (applicationno) DO UPDATE SET " +
                "inspection_type = EXCLUDED.inspection_type, " +
                "inspection_date = EXCLUDED.inspection_date, " +
                "inspector_name = EXCLUDED.inspector_name, " +
                "lastmodifiedby = EXCLUDED.lastmodifiedby, " +
                "lastmodifiedtime = EXCLUDED.lastmodifiedtime",
                tenantId
        );

        jdbcTemplate.update(sql, applicationNo, inspectionType, inspectionDate, inspectorName, userId, now, userId, now);
        log.info("Saved inspection information in eg_ws_inspection_information for application: {}", applicationNo);
    }

    /**
     * Updates {schema}.eg_ws_connection.additionaldetails with merged JSON preserving all existing keys
     */
    public void updateConnectionAdditionalDetails(String tenantId, String connectionId, String applicationNo, ObjectNode mergedDetails, RequestInfo requestInfo) {
        if (mergedDetails == null || (StringUtils.isEmpty(applicationNo) && StringUtils.isEmpty(connectionId))) {
            return;
        }

        String userId = (requestInfo != null && requestInfo.getUserInfo() != null) ? requestInfo.getUserInfo().getUuid() : "SYSTEM";
        long now = System.currentTimeMillis();

        try {
            PGobject jsonObject = new PGobject();
            jsonObject.setType("jsonb");
            jsonObject.setValue(mapper.writeValueAsString(mergedDetails));

            String sql = schemaSql(
                    "UPDATE {schema}.eg_ws_connection " +
                    "SET additionaldetails = ?, lastmodifiedby = ?, lastmodifiedtime = ? " +
                    "WHERE id = ? OR applicationno = ?",
                    tenantId
            );

            jdbcTemplate.update(sql, jsonObject, userId, now, connectionId, applicationNo);
            log.info("Updated additionaldetails in eg_ws_connection for connectionId: {}, application: {}", connectionId, applicationNo);
        } catch (Exception e) {
            log.error("Error updating additionaldetails for application: {}", applicationNo, e);
            throw new CustomException("WS_SITE_INSPECTION_UPDATE_FAILED", "Failed to update connection additional details: " + e.getMessage());
        }
    }

    /**
     * Inserts inspection documents/photos into {schema}.eg_ws_applicationdocument
     */
    public void saveInspectionDocuments(String tenantId, String connectionId, List<Document> documents, RequestInfo requestInfo) {
        if (CollectionUtils.isEmpty(documents) || StringUtils.isEmpty(connectionId)) {
            return;
        }

        String userId = (requestInfo != null && requestInfo.getUserInfo() != null) ? requestInfo.getUserInfo().getUuid() : "SYSTEM";
        long now = System.currentTimeMillis();

        String sql = schemaSql(
                "INSERT INTO {schema}.eg_ws_applicationdocument " +
                "(id, tenantid, documenttype, filestoreid, wsid, active, documentUid, createdby, lastmodifiedby, createdtime, lastmodifiedtime) " +
                "VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?) " +
                "ON CONFLICT (id) DO UPDATE SET " +
                "documenttype = EXCLUDED.documenttype, " +
                "filestoreid = EXCLUDED.filestoreid, " +
                "active = EXCLUDED.active, " +
                "documentUid = EXCLUDED.documentUid, " +
                "lastmodifiedby = EXCLUDED.lastmodifiedby, " +
                "lastmodifiedtime = EXCLUDED.lastmodifiedtime",
                tenantId
        );

        for (Document doc : documents) {
            if (doc == null || StringUtils.isEmpty(doc.getFileStoreId())) {
                continue;
            }
            String docId = StringUtils.isEmpty(doc.getId()) ? UUID.randomUUID().toString() : doc.getId();
            doc.setId(docId);
            String docType = StringUtils.isEmpty(doc.getDocumentType()) ? "SITE_INSPECTION_PHOTO" : doc.getDocumentType();
            String docUid = StringUtils.isEmpty(doc.getDocumentUid()) ? docId : doc.getDocumentUid();

            jdbcTemplate.update(sql, docId, tenantId, docType, doc.getFileStoreId(), connectionId, docUid, userId, userId, now, now);
        }
        log.info("Saved {} inspection document(s) in eg_ws_applicationdocument for connection: {}", documents.size(), connectionId);
    }
}

