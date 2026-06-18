import AadhaarVerification from "../components/AadhaarVerification";

export const ekycConfig = [
  {
    body: [
      {
        route: "consumer-details",
        component: AadhaarVerification,
        key: "aadhaarVerification",
        texts: {
          header: "EKYC_CONSUMER_CONNECTION",
          submitBarLabel: "COMMON_SAVE_NEXT",
        },
        timeLine: [
          {
            currentStep: 1,
            actions: "EKYC_CONSUMER_CONNECTION",
          },
        ],
      },
      {
        route: "address-details",
        component: "AddressDetails",
        key: "addressDetails",
        doorImage: true,
        showMapActualLocation: false,
        texts: {
          header: "EKYC_ADDRESS_DETAILS",
          submitBarLabel: "COMMON_SAVE_NEXT",
        },
        timeLine: [
          {
            currentStep: 2,
            actions: "EKYC_ADDRESS_DETAILS",
          },
        ],
      },
      {
        route: "property-info",
        component: "PropertyInfo",
        key: "propertyDetails",
        texts: {
          header: "EKYC_PROPERTY_INFO",
          submitBarLabel: "COMMON_SAVE_NEXT",
        },
        timeLine: [
          {
            currentStep: 3,
            actions: "EKYC_PROPERTY_INFO",
          },
        ],
      },
      {
        route: "meter-details",
        component: "MeterDetails",
        key: "meterDetails",
        texts: {
          header: "EKYC_METER_DETAILS",
          submitBarLabel: "COMMON_SAVE_NEXT",
        },
        timeLine: [
          {
            currentStep: 4,
            actions: "EKYC_METER_DETAILS",
          },
        ],
      },
    ],
  },
];
