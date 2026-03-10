import { format } from "date-fns";
import { VariablesTypes } from "dhis2-semis-types";
import { capitalizeString } from "dhis2-semis-functions";

const staticForm = () => {
  return {
    registeringSchool: {
      required: true,
      name: "registerschoolstaticform",
      labelName: "Registering School",
      valueType: "TEXT",
      options: undefined,
      disabled: true,
      pattern: "",
      visible: true,
      description: "Registering School",
      searchable: false,
      error: false,
      programStage: "",
      content: "",
      id: "registerschoolstaticform",
      displayName: "Registering School",
      header: "Registering School",
      type: VariablesTypes.DataElement,
      assignedValue: undefined
    },
    admissionDate: {
      required: true,
      name: "admission_date",
      labelName: "Admission date",
      valueType: "DATE",
      options: undefined,
      disabled: false,
      pattern: "",
      visible: true,
      description: "Admission date",
      searchable: false,
      error: false,
      programStage: "",
      content: "",
      id: "admission_date",
      displayName: "Admission date",
      header: "Admission date",
      type: VariablesTypes.DataElement,
      assignedValue: format(new Date(), "yyyy-MM-dd")
    }
  }
}

function formFields({ formFieldsData, sectionName }: { formFieldsData: any[], sectionName: string }) {

  const [admissionDetails = [], studentsProfile = [], socioEconomicDetails = []] = formFieldsData;

  return [
    {
      name: "Admission Details",
      description: "Details related to the admission process",
      visible: true,
      fields: [
        staticForm().registeringSchool,
        ...admissionDetails,
        staticForm().admissionDate
      ]
    },
    {
      name: `${capitalizeString(sectionName)} Profile`,
      description: `${capitalizeString(sectionName)} personal details`,
      visible: true,
      fields: [
        ...studentsProfile
      ]
    },
    {
      name: "Socio-economic Details",
      description: `Details about the ${sectionName} socio-economic status`,
      visible: Boolean(socioEconomicDetails.length),
      fields: [
        ...socioEconomicDetails
      ]
    }
  ];
}

export { formFields, staticForm };