package org.egov.vendor.surveyor.repository.querybuilder;

import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.egov.vendor.config.VendorConfiguration;
import org.egov.vendor.surveyor.web.model.SurveyorSearchCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

@Component
public class SurveyorQueryBuilder {

    @Autowired
    private VendorConfiguration config;

    private static final String QUERY =
            "SELECT count(*) OVER() AS full_count,"
                    + " surveyor.*,"
                    + " sup.name AS supervisor_name,"
                    + " v.name   AS vendor_name"
                    + " FROM eg_surveyor surveyor"
                    + " LEFT JOIN eg_supervisor sup ON sup.id = surveyor.supervisor_id"
                    + " LEFT JOIN eg_vendor     v   ON v.id   = surveyor.vendor_id";

    private static final String PAGINATION_WRAPPER =
            "SELECT * FROM "
                    + "(SELECT *, DENSE_RANK() OVER (ORDER BY SORT_BY SORT_ORDER) offset_ FROM ({}) result) result_offset "
                    + "limit ? offset ?";

    public String getSurveyorSearchQuery(SurveyorSearchCriteria criteria, List<Object> preparedStmtList) {
        StringBuilder builder = new StringBuilder(QUERY);

        if (criteria.getTenantId() != null) {
            if (criteria.getTenantId().split("\\.").length == 1) {
                addClauseIfRequired(preparedStmtList, builder);
                builder.append(" surveyor.tenantid like ?");
                preparedStmtList.add('%' + criteria.getTenantId() + '%');
            } else {
                addClauseIfRequired(preparedStmtList, builder);
                builder.append(" surveyor.tenantid = ?");
                preparedStmtList.add(criteria.getTenantId());
            }
        }

        if (StringUtils.isNotBlank(criteria.getVendorId())) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" surveyor.vendor_id = ?");
            preparedStmtList.add(criteria.getVendorId());
        }

        if (StringUtils.isNotBlank(criteria.getMobileNumber())) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" surveyor.mobile_no = ?");
            preparedStmtList.add(criteria.getMobileNumber());
        }

        if (StringUtils.isNotBlank(criteria.getSupervisorId())) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" surveyor.supervisor_id = ?");
            preparedStmtList.add(criteria.getSupervisorId());
        }

        List<String> ownerIds = criteria.getOwnerIds();
        if (!CollectionUtils.isEmpty(ownerIds)) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" surveyor.owner_id IN (").append(createQuery(ownerIds)).append(")");
            addToPreparedStatement(preparedStmtList, ownerIds);
        }

        List<String> ids = criteria.getIds();
        if (!CollectionUtils.isEmpty(ids)) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" surveyor.id IN (").append(createQuery(ids)).append(")");
            addToPreparedStatement(preparedStmtList, ids);
        }

        List<String> status = criteria.getStatus();
        if (!CollectionUtils.isEmpty(status)) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" surveyor.status IN (").append(createQuery(status)).append(")");
            addToPreparedStatement(preparedStmtList, status);
        }

        return addPaginationWrapper(builder.toString(), preparedStmtList, criteria);
    }

    private String addPaginationWrapper(String query, List<Object> preparedStmtList,
                                        SurveyorSearchCriteria criteria) {
        int limit  = config.getDefaultLimit();
        int offset = config.getDefaultOffset();
        String finalQuery = PAGINATION_WRAPPER.replace("{}", query);

        if (criteria.getSortBy() != null)
            finalQuery = finalQuery.replace("SORT_BY", criteria.getSortBy().toString());
        else
            finalQuery = finalQuery.replace("SORT_BY", "createdtime");

        if (criteria.getSortOrder() != null)
            finalQuery = finalQuery.replace("SORT_ORDER", criteria.getSortOrder().toString());
        else
            finalQuery = finalQuery.replace("SORT_ORDER", "DESC");

        if (criteria.getLimit() != null && criteria.getLimit() <= config.getMaxSearchLimit())
            limit = criteria.getLimit();
        if (criteria.getLimit() != null && criteria.getLimit() > config.getMaxSearchLimit())
            limit = config.getMaxSearchLimit();
        if (criteria.getOffset() != null)
            offset = criteria.getOffset();

        if (limit == -1) {
            finalQuery = finalQuery.replace("limit ? offset ?", "");
        } else {
            preparedStmtList.add(limit);
            preparedStmtList.add(offset);
        }
        return finalQuery;
    }

    private void addClauseIfRequired(List<Object> values, StringBuilder queryString) {
        if (values.isEmpty()) queryString.append(" WHERE ");
        else queryString.append(" AND ");
    }

    private void addToPreparedStatement(List<Object> preparedStmtList, List<String> ids) {
        ids.forEach(preparedStmtList::add);
    }

    private String createQuery(List<String> ids) {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < ids.size(); i++) {
            builder.append(" ?");
            if (i != ids.size() - 1) builder.append(",");
        }
        return builder.toString();
    }
}