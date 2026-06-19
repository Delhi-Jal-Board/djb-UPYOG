import React from "react";
import { UploadFile, Dropdown } from "@djb25/digit-ui-react-components";

const PropertyInfoConfig = (t, formData = {}, uploadFile, buildingImage, buildingImageId, setBuildingImage, setBuildingImageId) => {
  const propertyType = formData?.propertyType?.name || formData?.propertyType;
  const isHotel = propertyType === "Hotel";
  const isHospitalOrNursing = propertyType === "Hospital" || propertyType === "Nursing Home";

  const fields = [
    {
      label: t("PID Number"),
      isMandatory: false,
      type: "text",
      populators: {
        name: "pidNumber",
      },
    },
    {
      label: t("Property Type"),
      isMandatory: false,
      type: "custom",
      key: "propertyType",
      populators: {
        name: "propertyType",
        component: (props) => (
          <Dropdown
            option={[
              { name: "Residential" },
              { name: "Commercial" },
              { name: "Hotel" },
              { name: "Hospital" },
              { name: "Nursing Home" },
            ]}
            optionKey="name"
            selected={props.value}
            select={props.onChange}
          />
        ),
      },
    },
    {
      label: t("Sub Property Category"),
      isMandatory: false,
      type: "custom",
      key: "subPropertyCategory",
      populators: {
        name: "subPropertyCategory",
        component: (props) => (
          <Dropdown
            option={[]}
            optionKey="name"
            selected={props.value}
            select={props.onChange}
          />
        ),
      },
    },
    {
      label: t("No. of Floors"),
      isMandatory: true,
      type: "number",
      populators: {
        name: "noOfFloors",
        validation: {
          required: true,
          min: 1,
        },
      },
    },
    {
      label: t("Floor No. of this KNO"),
      isMandatory: false,
      type: "text",
      populators: {
        name: "floorNo",
      },
    },
    {
      label: isHospitalOrNursing ? t("No of Beds") : t("No of Beds"),
      isMandatory: isHospitalOrNursing,
      type: "number",
      populators: {
        name: "noOfBeds",
        validation: isHospitalOrNursing ? { required: true, min: 1 } : {},
      },
    },
    {
      label: isHotel ? t("No. of Rooms") : t("No. of Rooms"),
      isMandatory: isHotel,
      type: "number",
      populators: {
        name: "noOfRooms",
        validation: isHotel ? { required: true, min: 1 } : {},
      },
    },
    {
      label: t("Number of Dwelling Units"),
      isMandatory: false,
      type: "number",
      populators: {
        name: "dwellingUnits",
      },
    },
    {
      label: t("Building Image"),
      isMandatory: true,
      type: "custom",
      key: "buildingImage",
      populators: {
        name: "buildingImage",
        component: (props) => (
          <div>
            <UploadFile
              onUpload={(e) => uploadFile(e, props.onChange)}
              onDelete={() => {
                props.onChange(null);
                setBuildingImage(null);
                setBuildingImageId(null);
              }}
              message={buildingImageId ? t("Uploaded") : t("No file selected")}
            />
            {buildingImage && (
              <div style={{ marginTop: "10px" }}>
                <img
                  src={buildingImage}
                  alt="preview"
                  style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }}
                />
              </div>
            )}
          </div>
        ),
      },
    },
  ];

  return [
    {
      head: t("EKYC_PROPERTY_DETAILS"),
      body: fields,
    },
  ];
};

export default PropertyInfoConfig;
