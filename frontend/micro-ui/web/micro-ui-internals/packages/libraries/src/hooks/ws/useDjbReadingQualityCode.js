import { useQuery } from "react-query";

const useDjbReadingQualityCodeList = (tenantId) => {
    return useQuery(["DJBReadingQualityCode", tenantId], () => Digit.MDMSService.getDJBReadingQualityCodeType(tenantId));
  };

export default useDjbReadingQualityCodeList;
