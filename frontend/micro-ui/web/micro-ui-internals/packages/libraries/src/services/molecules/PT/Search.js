import { getPropertySubtypeLocale, getPropertyTypeLocale } from "../../../utils/pt";
import { PTService } from "../../elements/PT";

export const PTSearch = {
  all: async (tenantId, filters = {}) => {
    const response = await PTService.search({ tenantId, filters });
    return response;
  },
  /**
   * Custom service which can be make a
   * property search using property id and tenant id
   * and return the property generic template to show employee and citizen view
   *
   * @author jagankumar-egov
   *
   * @example
   *  PTSearch.genericPropertyDetails(t,
   *                                  tenantId,
   *                                  propertyId)
   *
   * @returns {Object} Returns the object which contains
   *                   applicationDetails [which is a template of property details ]
   *                   applicationData  {which is a property object itself}
   */
  genericPropertyDetails: async (t, tenantId, propertyIds) => {
    const filters = { propertyIds };
    const property = await PTSearch.application(tenantId, filters);
    const addressDetails = {
      title: "PT_PROPERTY_ADDRESS_SUB_HEADER",
      asSectionHeader: true,
      values: [
        // { title: "WS_ZRO_LOCATION", value: property?.address?.zroLocation || property?.address?.additionalDetails?.zroLocation?.name || property?.address?.additionalDetails?.zroLocation || property?.additionalDetails?.zroLocation || "NA" },
        // { title: "COMMON_ADDRESS_TYPE", value: property?.address?.addressType || "NA" },
        { title: "PT_PROPERTY_ADDRESS_CITY", value: property?.address?.city || "NA" },
        { title: "PT_PROPERTY_ADDRESS_PINCODE", value: property?.address?.pincode || "NA" },
        {
          title: "PT_PROPERTY_ADDRESS_MOHALLA",
          value: `${property?.tenantId?.toUpperCase()?.split(".")?.join("_")}_REVENUE_${property?.address?.locality?.code}`,
        },
        { title: "SubLocality", value: property?.address?.subLocality || property?.address?.additionalDetails?.subLocality || "NA" },
        { title: "PT_PROPERTY_ADDRESS_STREET_NAME", value: property?.address?.street || "NA" },
        { title: "ADDRESS_LINE1", value: property?.address?.addressLine1 || property?.address?.street || "NA" },
        { title: "ADDRESS_LINE2", value: property?.address?.addressLine2 || "NA" },
        {
          title: "PT_PROPERTY_ADDRESS_HOUSE_NO",
          value: property?.address?.doorNo || property?.address?.houseNo || "NA",
          privacy: {
            uuid: property?.owners?.[0]?.uuid, fieldName: "doorNo", model: "Property",
            showValue: false,
            loadData: {
              serviceName: "/property-services/property/_search",
              requestBody: {},
              requestParam: { tenantId, propertyIds },
              jsonPath: "Properties[0].address.doorNo",
              isArray: false,
            },
          },
        },
        { title: "LATITUDE", value: property?.address?.geoLocation?.latitude || property?.address?.locality?.latitude || property?.address?.latitude || "NA" },
        { title: "LONGITUDE", value: property?.address?.geoLocation?.longitude || property?.address?.locality?.longitude || property?.address?.longitude || "NA" },
        { title: "ASSEMBLY", value: property?.address?.assembly || property?.address?.additionalDetails?.assembly?.name || property?.address?.additionalDetails?.assembly || property?.additionalDetails?.assembly || "NA" },
        { title: "WARD", value: property?.address?.block || property?.address?.ward || property?.address?.additionalDetails?.ward?.name || property?.address?.additionalDetails?.ward || property?.additionalDetails?.ward || "NA" },
        { title: "ZONE", value: property?.address?.zone || property?.address?.additionalDetails?.zone?.name || property?.address?.additionalDetails?.zone || property?.additionalDetails?.zone || "NA" },
        { title: "ACTUAL_ASSEMBLY", value: property?.address?.actualAssembly || "NA" },
        { title: "ACTUAL_WARD", value: property?.address?.actualWard || "NA" },
        { title: "ACTUAL_ZONE", value: property?.address?.actualZone || "NA" },
        { title: "LANDMARK", value: property?.address?.landmark || "NA" },
      ],
    };
    const assessmentDetails = {
      title: "PT_ASSESMENT_INFO_SUB_HEADER",
      values: [
        { title: "WS_CATEGORY_TYPE", value: property?.additionalDetails?.categoryType?.name || property?.additionalDetails?.categoryType?.code || property?.additionalDetails?.categoryType || "NA" },
        { title: "WS_PROPERTY_CATEGORY", value: property?.additionalDetails?.propertyCategory?.name || property?.additionalDetails?.propertyCategory?.code || property?.additionalDetails?.propertyCategory || "NA" },
        { title: "PT_ASSESMENT_INFO_TYPE_OF_BUILDING", value: getPropertyTypeLocale(property?.propertyType) || "NA" },
        { title: "WS_WATER_CONNECTION_USAGE_TYPE", value: property?.additionalDetails?.waterConnectionUsageType?.name || property?.additionalDetails?.waterConnectionUsageType?.code || property?.additionalDetails?.waterConnectionUsageType || "NA" },
        { title: "PT_ASSESMENT_INFO_USAGE_TYPE", value: getPropertySubtypeLocale(property?.usageCategory) || "NA" },
        { title: "PT_ASSESMENT_INFO_NO_OF_FLOOR", value: property?.noOfFloors || "NA" },
        { title: "PT_ASSESMENT_INFO_PLOT_SIZE", value: property?.landArea || property?.additionalDetails?.plotArea || "NA" },
        { title: "WS_BUILT_UP_AREA", value: property?.additionalDetails?.builtUpArea || property?.buildUpArea || property?.superBuiltUpArea || "NA" },
        { title: "WS_SELECT_YEAR_OF_CONSTRUCTION", value: property?.additionalDetails?.yearOfConstruction || property?.additionalDetails?.constructionYear?.code || property?.additionalDetails?.constructionYear || property?.additionalDetails?.SelectYearofConstruction?.code || "NA" },
        { title: "WS_NUMBER_OF_DWELLING_UNITS", value: property?.additionalDetails?.numberOfDwellingUnits || property?.additionalDetails?.noOfDwellingUnits || property?.additionalDetails?.NumberofDwellingUnits || "NA" },
      ],
    };
    const propertyDetail = {
      title: "PT_DETAILS",
      values: [
        { title: "TL_PROPERTY_ID", value: property?.propertyId || "NA" },
        { title: "PT_OWNER_NAME", value: property?.owners?.map((owner) => owner.name).reverse().join(",") || "NA" },
        { title: "PT_SEARCHPROPERTY_TABEL_STATUS", value: Digit.Utils.locale.getTransformedLocale(`WF_PT_${property?.status}`) || "NA" },
      ],
    };
    const ownersSequences=property?.owners?.additionalDetails!==null ? property?.owners?.sort((a,b)=>a?.additionalDetails?.ownerSequence-b?.additionalDetails?.ownerSequence): property?.owners
    const ownerdetails = {
      title: "PT_OWNERSHIP_INFO_SUB_HEADER",
      additionalDetails: {
        owners: ownersSequences
          ?.filter((owner) => owner.status === "ACTIVE")
          .map((owner, index) => {
            return {
              status: owner.status,
              title: "ES_OWNER",
              values: [
                { title: "PT_OWNERSHIP_INFO_NAME", value: owner?.name, privacy: { uuid: owner?.uuid, fieldName: "name", model: "User",showValue: false,
                loadData: {
                  serviceName: "/property-services/property/_search",
                  requestBody: {},
                  requestParam: { tenantId, propertyIds },
                  jsonPath: "Properties[0].owners[0].name",
                  isArray: false,
                }, } },
                { title: "PT_OWNERSHIP_INFO_GENDER", value: owner?.gender, privacy: { uuid: owner?.uuid, fieldName: "gender", model: "User",showValue: false,
                loadData: {
                  serviceName: "/property-services/property/_search",
                  requestBody: {},
                  requestParam: { tenantId, propertyIds },
                  jsonPath: "Properties[0].owners[0].gender",
                  isArray: false,
                }, }  },
                {
                  title: "PT_OWNERSHIP_INFO_MOBILE_NO",
                  value: owner?.mobileNumber,
                  privacy: { uuid: owner?.uuid, fieldName: "mobileNumber", model: "User",showValue: false,
                  loadData: {
                    serviceName: "/property-services/property/_search",
                    requestBody: {},
                    requestParam: { tenantId, propertyIds },
                    jsonPath: "Properties[0].owners[0].mobileNumber",
                    isArray: false,
                  }, },
                },
                {
                  title: "PT_OWNERSHIP_INFO_USER_CATEGORY",
                  value: `COMMON_MASTERS_OWNERTYPE_${owner?.ownerType}` || "NA",
                  privacy: { uuid: owner?.uuid, fieldName: "ownerType", model: "User",showValue: false,
                  loadData: {
                    serviceName: "/property-services/property/_search",
                    requestBody: {},
                    requestParam: { tenantId, propertyIds },
                    jsonPath: "Properties[0].owners[0].ownerType",
                    //function needed here for localisation
                    isArray: false,
                  }, },
                },
                {
                  title: "PT_SEARCHPROPERTY_TABEL_GUARDIANNAME",
                  value: owner?.fatherOrHusbandName,
                  privacy: { uuid: owner?.uuid, fieldName: "guardian", model: "User",showValue: false,
                  loadData: {
                    serviceName: "/property-services/property/_search",
                    requestBody: {},
                    requestParam: { tenantId, propertyIds },
                    jsonPath: "Properties[0].owners[0].fatherOrHusbandName",
                    isArray: false,
                  }, },
                },
                { title: "PT_FORM3_OWNERSHIP_TYPE", value: property?.ownershipCategory },
                {
                  title: "PT_OWNERSHIP_INFO_EMAIL_ID",
                  value: owner?.emailId,
                  privacy: { uuid: owner?.uuid, fieldName: "emailId", model: "User", hide: !(owner?.emailId && owner?.emailId !== "NA"),showValue: false,
                  loadData: {
                    serviceName: "/property-services/property/_search",
                    requestBody: {},
                    requestParam: { tenantId, propertyIds },
                    jsonPath: "Properties[0].owners[0].emailId",
                    isArray: false,
                  }, },
                },
                {
                  title: "PT_OWNERSHIP_INFO_CORR_ADDR",
                  value: owner?.permanentAddress || owner?.correspondenceAddress,
                  privacy: {
                    uuid: owner?.uuid,
                    fieldName: owner?.permanentAddress ? "permanentAddress" : "correspondenceAddress",
                    model: "User",
                    hide: !(owner?.permanentAddress || owner?.correspondenceAddress),
                    showValue: false,
                loadData: {
                  serviceName: "/property-services/property/_search",
                  requestBody: {},
                  requestParam: { tenantId, propertyIds },
                  jsonPath: owner?.permanentAddress ? "Properties[0].owners[0].permanentAddress" :"Properties[0].owners[0].correspondenceAddress",
                  isArray: false,
                },
                  },
                },
              ],
            };
          }),
      },
    };

    const applicationDetails = [propertyDetail, addressDetails, assessmentDetails];
    return {
      tenantId: property?.tenantId,
      applicationDetails,
      applicationData: property,
    };
  },
  application: async (tenantId, filters = {}) => {
    const response = await PTService.search({ tenantId, filters });
    return response.Properties[0];
  },
  transformPropertyToApplicationDetails: ({ property: response, t }) => {
    return [
      {
        title: "PT_PROPERTY_ADDRESS_SUB_HEADER",
        asSectionHeader: true,
        values: [
          // { title: "WS_ZRO_LOCATION", value: response?.address?.zroLocation || response?.address?.additionalDetails?.zroLocation?.name || response?.address?.additionalDetails?.zroLocation || response?.additionalDetails?.zroLocation || "NA" },
          // { title: "COMMON_ADDRESS_TYPE", value: response?.address?.addressType || "NA" },
          { title: "PT_PROPERTY_ADDRESS_CITY", value: response?.address?.city || "NA" },
          { title: "PT_PROPERTY_ADDRESS_PINCODE", value: response?.address?.pincode || "NA" },
          {
            title: "PT_PROPERTY_ADDRESS_MOHALLA",
            value: `${response?.tenantId?.toUpperCase()?.split(".")?.join("_")}_REVENUE_${response?.address?.locality?.code}`,
          },
          { title: "SubLocality", value: response?.address?.subLocality || response?.address?.additionalDetails?.subLocality || "NA" },
          { title: "PT_PROPERTY_ADDRESS_STREET_NAME", value: response?.address?.street || "NA" },
          { title: "ADDRESS_LINE1", value: response?.address?.addressLine1 || response?.address?.street || "NA" },
          { title: "ADDRESS_LINE2", value: response?.address?.addressLine2 || "NA" },
          {
            title: "PT_PROPERTY_ADDRESS_HOUSE_NO",
            value: response?.address?.doorNo || response?.address?.houseNo || "NA",
            privacy: {
              uuid: response?.owners?.[0]?.uuid,
              fieldName: "doorNo",
              model: "Property",
              showValue: false,
              loadData: {
                serviceName: "/property-services/property/_search",
                requestBody: {},
                requestParam: { tenantId : response?.tenantId, propertyIds:response?.propertyId },
                jsonPath: "Properties[0].address.doorNo",
                isArray: false,
              },
            },
          },
          { title: "LATITUDE", value: response?.address?.geoLocation?.latitude || response?.address?.locality?.latitude || response?.address?.latitude || "NA" },
          { title: "LONGITUDE", value: response?.address?.geoLocation?.longitude || response?.address?.locality?.longitude || response?.address?.longitude || "NA" },
          { title: "ASSEMBLY", value: response?.address?.assembly || response?.address?.additionalDetails?.assembly?.name || response?.address?.additionalDetails?.assembly || response?.additionalDetails?.assembly || "NA" },
          { title: "WARD", value: response?.address?.block || response?.address?.ward || response?.address?.additionalDetails?.ward?.name || response?.address?.additionalDetails?.ward || response?.additionalDetails?.ward || "NA" },
          { title: "ZONE", value: response?.address?.zone || response?.address?.additionalDetails?.zone?.name || response?.address?.additionalDetails?.zone || response?.additionalDetails?.zone || "NA" },
          { title: "ACTUAL_ASSEMBLY", value: response?.address?.actualAssembly || "NA" },
          { title: "ACTUAL_WARD", value: response?.address?.actualWard || "NA" },
          { title: "ACTUAL_ZONE", value: response?.address?.actualZone || "NA" },
          { title: "LANDMARK", value: response?.address?.landmark || "NA" },
        ],
      },
      {
        title: "PT_ASSESMENT_INFO_SUB_HEADER",
        values: [
          { title: "WS_CATEGORY_TYPE", value: response?.additionalDetails?.categoryType?.name || response?.additionalDetails?.categoryType?.code || response?.additionalDetails?.categoryType || "NA" },
          { title: "WS_PROPERTY_CATEGORY", value: response?.additionalDetails?.propertyCategory?.name || response?.additionalDetails?.propertyCategory?.code || response?.additionalDetails?.propertyCategory || "NA" },
          { title: "PT_ASSESMENT_INFO_TYPE_OF_BUILDING", value: getPropertyTypeLocale(response?.propertyType) || "NA" },
          { title: "WS_WATER_CONNECTION_USAGE_TYPE", value: response?.additionalDetails?.waterConnectionUsageType?.name || response?.additionalDetails?.waterConnectionUsageType?.code || response?.additionalDetails?.waterConnectionUsageType || "NA" },
          { title: "PT_ASSESMENT_INFO_USAGE_TYPE", value: response?.usageCategory ? getPropertySubtypeLocale(response?.usageCategory) : `N/A` },
          { title: "PT_ASSESMENT_INFO_NO_OF_FLOOR", value: response?.noOfFloors || "NA" },
          { title: "PT_ASSESMENT_INFO_PLOT_SIZE", value: response?.landArea || response?.additionalDetails?.plotArea || "NA" },
          { title: "WS_BUILT_UP_AREA", value: response?.additionalDetails?.builtUpArea || response?.buildUpArea || response?.superBuiltUpArea || "NA" },
          { title: "WS_SELECT_YEAR_OF_CONSTRUCTION", value: response?.additionalDetails?.yearOfConstruction || response?.additionalDetails?.constructionYear?.code || response?.additionalDetails?.constructionYear || response?.additionalDetails?.SelectYearofConstruction?.code || "NA" },
          { title: "WS_NUMBER_OF_DWELLING_UNITS", value: response?.additionalDetails?.numberOfDwellingUnits || response?.additionalDetails?.noOfDwellingUnits || response?.additionalDetails?.NumberofDwellingUnits || "NA" },
        ],
        additionalDetails: {
          floors: response?.units
            ?.filter((e) => e.active)
            ?.sort?.((a, b) => a.floorNo - b.floorNo)
            ?.map((unit, index) => {
              let floorName = `PROPERTYTAX_FLOOR_${unit.floorNo}`;
              const values = [
                {
                  title: "PT_ASSESSMENT_UNIT_USAGE_TYPE",
                  value: `PROPERTYTAX_BILLING_SLAB_${
                    unit?.usageCategory != "RESIDENTIAL" ? unit?.usageCategory?.split(".")[1] : unit?.usageCategory
                  }`,
                },
                {
                  title: "PT_ASSESMENT_INFO_OCCUPLANCY",
                  value: unit?.occupancyType,
                },
                {
                  title: "PT_FORM2_BUILT_AREA",
                  value: unit?.constructionDetail?.builtUpArea,
                },
              ];

              if (unit.occupancyType === "RENTED") values.push({ title: "PT_FORM2_TOTAL_ANNUAL_RENT", value: unit.arv });

              return {
                title: floorName,
                values: [
                  {
                    title: `${t("ES_APPLICATION_DETAILS_UNIT")} ${index + 1}`,
                    values,
                  },
                ],
              };
            }),
        },
      },
    ];
  },
  applicationDetails: async (t, tenantId, propertyIds, userType, args) => {
    const filter = { propertyIds, ...args };
    const response = await PTSearch.application(tenantId, filter);

    return {
      tenantId: response.tenantId,
      applicationDetails: PTSearch.transformPropertyToApplicationDetails({ property: response, t }),
      additionalDetails: response?.additionalDetails,
      applicationData: response,
      transformToAppDetailsForEmployee: PTSearch.transformPropertyToApplicationDetails,
    };
  },
};
