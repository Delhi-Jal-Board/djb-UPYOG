package org.egov.vendor.supervisor.repository.querybuilder;

import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.egov.vendor.config.VendorConfiguration;
import org.egov.vendor.supervisor.web.model.SupervisorSearchCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

@Component
public class SupervisorQueryBuilder {

    @Autowired
    private VendorConfiguration config;

    private static final String BASE_QUERY =
            "SELECT count(*) OVER() AS full_count,"
                    + " supervisor.*,"
                    + " v.name AS vendor_name"
                    + " FROM eg_supervisor supervisor"
                    + " LEFT JOIN eg_vendor v ON v.id = supervisor.vendor_id";

    private static final String PAGINATION_WRAPPER =
            "SELECT * FROM "
                    + "(SELECT *, DENSE_RANK() OVER (ORDER BY createdtime DESC) offset_ FROM ({}) result) result_offset "
                    + "WHERE offset_ > ? AND offset_ <= ?";

    public String getSearchQuery(SupervisorSearchCriteria criteria, List<Object> preparedStmtList) {

        StringBuilder builder = new StringBuilder(BASE_QUERY);

        if (criteria.getTenantId() != null) {
            if (criteria.getTenantId().split("\\.").length == 1) {
                addClauseIfRequired(preparedStmtList, builder);
                builder.append(" supervisor.tenantid like ?");
                preparedStmtList.add('%' + criteria.getTenantId() + '%');
            } else {
                addClauseIfRequired(preparedStmtList, builder);
                builder.append(" supervisor.tenantid = ?");
                preparedStmtList.add(criteria.getTenantId());
            }
        }

        if (StringUtils.isNotBlank(criteria.getVendorId())) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" supervisor.vendor_id = ?");
            preparedStmtList.add(criteria.getVendorId());
        }

        if (StringUtils.isNotBlank(criteria.getAssignedZoneId())) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" supervisor.assigned_zone_id = ?");
            preparedStmtList.add(criteria.getAssignedZoneId());
        }

        List<String> names = criteria.getName();
        if (!CollectionUtils.isEmpty(names)) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" ( ");
            boolean flag = false;
            for (String name : names) {
                if (flag) builder.append(" OR ");
                builder.append(" LOWER(supervisor.name) like ?");
                preparedStmtList.add('%' + StringUtils.lowerCase(name) + '%');
                builder.append(" ESCAPE '_' ");
                flag = true;
            }
            builder.append(" ) ");
        }

        // mobileNumber filter — search supervisors by mobile number
        if (StringUtils.isNotBlank(criteria.getMobileNumber())) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" supervisor.mobile_no = ?");
            preparedStmtList.add(criteria.getMobileNumber());
        }

        // vendorName filter — search supervisors by agency name (partial, case-insensitive)
        if (StringUtils.isNotBlank(criteria.getVendorName())) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" LOWER(v.name) LIKE ? ESCAPE '_'");
            preparedStmtList.add('%' + criteria.getVendorName().toLowerCase() + '%');
        }

        List<String> ownerIds = criteria.getOwnerIds();
        if (!CollectionUtils.isEmpty(ownerIds)) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" supervisor.owner_id IN (").append(createQuery(ownerIds)).append(")");
            addToPreparedStatement(preparedStmtList, ownerIds);
        }

        List<String> ids = criteria.getIds();
        if (!CollectionUtils.isEmpty(ids)) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" supervisor.id IN (").append(createQuery(ids)).append(")");
            addToPreparedStatement(preparedStmtList, ids);
        }

        List<String> status = criteria.getStatus();
        if (!CollectionUtils.isEmpty(status)) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" supervisor.status IN (").append(createQuery(status)).append(")");
            addToPreparedStatement(preparedStmtList, status);
        }

        return addPaginationWrapper(builder.toString(), preparedStmtList, criteria);
    }

    private String addPaginationWrapper(String query, List<Object> preparedStmtList,
                                        SupervisorSearchCriteria criteria) {

        int limit  = config.getDefaultLimit();
        int offset = config.getDefaultOffset();

        String finalQuery = PAGINATION_WRAPPER.replace("{}", query);

        if (criteria.getLimit() != null && criteria.getLimit() <= config.getMaxSearchLimit())
            limit = criteria.getLimit();

        if (criteria.getLimit() != null && criteria.getLimit() > config.getMaxSearchLimit())
            limit = config.getMaxSearchLimit();

        if (criteria.getOffset() != null)
            offset = criteria.getOffset();

        if (limit == -1) {
            finalQuery = finalQuery.replace("WHERE offset_ > ? AND offset_ <= ?", "");
        } else {
            preparedStmtList.add(offset);
            preparedStmtList.add(offset + limit);
        }

        return finalQuery;
    }

    private void addClauseIfRequired(List<Object> values, StringBuilder queryString) {
        if (values.isEmpty())
            queryString.append(" WHERE ");
        else
            queryString.append(" AND ");
    }

    private void addToPreparedStatement(List<Object> preparedStmtList, List<String> ids) {
        ids.forEach(preparedStmtList::add);
    }

    private String createQuery(List<String> ids) {
        StringBuilder builder = new StringBuilder();
        int length = ids.size();
        for (int i = 0; i < length; i++) {
            builder.append(" ?");
            if (i != length - 1) builder.append(",");
        }
        return builder.toString();
    }
}