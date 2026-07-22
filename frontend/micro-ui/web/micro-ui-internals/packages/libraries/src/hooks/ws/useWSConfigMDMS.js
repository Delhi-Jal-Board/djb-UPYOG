import React from "react";
import { useQuery } from "react-query";
import { MdmsService } from "../../services/elements/MDMS";

const useWSConfigMDMS = {
  WSCreateConfig: (tenantId, config) =>
    useQuery(
      [tenantId, "FORM_WS_ACTIVATION_CONFIG"],
      () =>
        MdmsService.getDataByCriteria(
          tenantId,
          {
            details: {
              tenantId: tenantId,
              moduleDetails: [
                {
                  moduleName: "ws-services-masters",
                  masterDetails: [
                    {
                      name: "WSCreateConfig",
                    },
                  ],
                },
              ],
            },
          },
          "WS"
        ),
      { select: (d) => d?.["ws-services-masters"]?.WSCreateConfig || [], ...config }
    ),

  ZROLocation: (tenantId, config) =>
    useQuery(
      [tenantId, "ZRO_LOCATION"],
      () =>
        MdmsService.getDataByCriteria(
          tenantId,
          {
            details: {
              tenantId: tenantId,
              moduleDetails: [
                {
                  moduleName: "ws-services-masters",
                  masterDetails: [
                    {
                      name: "ZROLocation",
                    },
                  ],
                },
              ],
            },
          },
          "WS"
        ),
      {
        select: (d) => d?.["ws-services-masters"]?.ZROLocation || [],
        ...config,
      }
    ),

  WSActivationConfig: (tenantId, config) =>
    useQuery(
      [tenantId, "FORM_WS_ACTIVATION_CONFIG"],
      () =>
        MdmsService.getDataByCriteria(
          tenantId,
          {
            details: {
              tenantId: tenantId,
              moduleDetails: [
                {
                  moduleName: "ws-services-masters",
                  masterDetails: [
                    {
                      name: "WSActivationConfig",
                    },
                  ],
                },
              ],
            },
          },
          "WS"
        ),
      { select: (d) => d?.["ws-services-masters"]?.WSActivationConfig || [], ...config }
    ),

  WSDisconnectionConfig: (tenantId, config) =>
    useQuery(
      [tenantId, "FORM_WS_ACTIVATION_CONFIG"],
      () =>
        MdmsService.getDataByCriteria(
          tenantId,
          {
            details: {
              tenantId: tenantId,
              moduleDetails: [
                {
                  moduleName: "ws-services-masters",
                  masterDetails: [
                    {
                      name: "WSDisconnectionConfig",
                    },
                  ],
                },
              ],
            },
          },
          "WS"
        ),
      { select: (d) => d?.["ws-services-masters"]?.WSDisconnectionConfig || [], ...config }
    ),

  ConnectionCategory: (tenantId, config) =>
    useQuery(
      [tenantId, "CONNECTION_CATEGORY"],
      () =>
        MdmsService.getDataByCriteria(
          tenantId,
          {
            details: {
              tenantId: tenantId,
              moduleDetails: [
                {
                  moduleName: "ws-services-masters",
                  masterDetails: [
                    {
                      name: "connectionCategory",
                    },
                  ],
                },
              ],
            },
          },
          "WS"
        ),
      {
        select: (d) => d?.["ws-services-masters"]?.connectionCategory || [],
        ...config,
      }
    ),

  OwnerType: (tenantId, config) =>
    useQuery(
      [tenantId, "OWNER_TYPE"],
      () =>
        MdmsService.getDataByCriteria(
          tenantId,
          {
            details: {
              tenantId: tenantId,
              moduleDetails: [
                {
                  moduleName: "ws-services-masters",
                  masterDetails: [
                    {
                      name: "OwnerType",
                    },
                  ],
                },
              ],
            },
          },
          "WS"
        ),
      {
        select: (d) =>
          (d?.["ws-services-masters"]?.OwnerType || d?.["ws-services-masters"]?.ownerType)?.map((item) => ({
            ...item,
            i18nKey: item?.i18nKey || `PROPERTYTAX_OWNERTYPE_${item?.code}`,
            code: item?.code || item?.value,
          })),
        ...config,
      }
    ),
  getFormConfig: (tenantId, config) =>
    useQuery(
      [tenantId, "FORM_CONFIG"],
      () =>
        MdmsService.getDataByCriteria(
          tenantId,
          {
            details: {
              tenantId: tenantId,
              moduleDetails: [
                {
                  moduleName: "ws-services-masters",
                  masterDetails: [
                    {
                      name: "WSCreateConfig",
                    },
                    {
                      name: "WSActivationConfig",
                    },
                    {
                      name: "WSDisconnectionConfig",
                    },
                    { name: "OwnerType" },
                  ],
                },
              ],
            },
          },
          "ws-services-masters"
        ),
      { select: (d) => d?.["ws-services-masters"], ...config }
    ),
};

export default useWSConfigMDMS;
