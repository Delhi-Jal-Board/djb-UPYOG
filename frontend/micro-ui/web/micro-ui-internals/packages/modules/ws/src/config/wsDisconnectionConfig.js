export const newConfig = [
  {
    head: "NEW_DISCONNECTION",
    body: [
      {
        route: "k-number",
        component: "WSDisconnectionKNumber",
        key: "WSDisconnectionKNumber",
        type: "component",
        withoutLabel: true,
        nextStep: "consumer-details",
      },
      {
        route: "consumer-details",
        component: "WSDisconnectionConsumerDetails",
        key: "WSDisconnectionConsumerDetails",
        type: "component",
        withoutLabel: true,
        nextStep: "application-form",
      },
      {
        route: "application-form",
        component: "WSDisconnectionForm",
        key: "WSDisconnectionForm",
        type: "component",
        withoutLabel: true,
        nextStep: "check",
      },
      {
        route: "check",
        component: "WSDisconnectionCheckPage",
        key: "WSDisconnectionCheckPage",
        type: "component",
        isMandatory: true,
        withoutLabel: true,
        nextStep: "disconnect-acknowledge",
        hideInEmployee: true,
      },
      {
        route: "disconnect-acknowledge",
        component: "WSDisconnectAcknowledgement",
        key: "WSDisconnectAcknowledgement",
        type: "component",
        isMandatory: true,
        withoutLabel: true,
        hideInEmployee: true,
      }
    ]
  },
  {
    head: "WS_APP_FOR_WATER_AND_SEWERAGE_LABEL",
    isEditByConfig: true,
    hideInCitizen: true,
    isDisonnectionEdit: true,
    isDisonnectionEditByConfig: true,
    body: [
      {
        head: "",
        isDisonnectionEdit: true,
        isDisonnectionEditByConfig: true,
        body: [
          {
            type: "component",
            key: "disConnectionDetails",
            component: "WSDisconnectionAppDetails",
            isDisonnectionEdit: true,
            withoutLabel: true
          }
        ]
      },
    ]
  },
  {
    head: "RE_SUBMIT_DISCONNECTION_APPLICATION",
    body: [
      {
        route: "application-form",
        component: "WSDisconnectionForm",
        key: "WSDisconnectionForm",
        type: "component",
        withoutLabel: true,
        nextStep: "check",
      },
      {
        route: "check",
        component: "WSReSubmitDisconnectionCheckPage",
        key: "WSReSubmitDisconnectionCheckPage",
        type: "component",
        isMandatory: true,
        withoutLabel: true,
        nextStep: "disconnect-acknowledge",
        hideInEmployee: true,
      },
      {
        route: "disconnect-acknowledge",
        component: "WSDisconnectAcknowledgement",
        key: "WSDisconnectAcknowledgement",
        type: "component",
        isMandatory: true,
        withoutLabel: true,
        hideInEmployee: true,
      }
    ]
  },
]
