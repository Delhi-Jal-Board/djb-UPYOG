
export const ekycConfig = [
  {
    body: [
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
    ],
  },
];
