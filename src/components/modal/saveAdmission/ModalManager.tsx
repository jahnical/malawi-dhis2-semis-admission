import { format } from "date-fns";
import { useRecoilState } from "recoil";
import ModalContent from "./ModalContent";
import React, { useEffect, useState } from "react";
import { TableDataRefetch } from "dhis2-semis-types"
import { ModalManagerInterface } from "../../../types/modal/ModalProps";
import useGetSelectedKeys from "../../../hooks/config/useGetSelectedKeys";
import { ModalComponent, useGetUsedProgramStages, } from "dhis2-semis-components";
import { admissionPostBody, admissionUpdateBody } from "../../../utils/admission";
import useGetAdmissionUpdateInitialValues from "../../../hooks/form/useGetAdmissionUpdateInitialValues";
import { useGetAttributes, useGetPatternCode, useSaveTei, useUrlParams, useGetSectionTypeLabel, RulesEngine, capitalizeString } from "dhis2-semis-functions";


function ModalManager(props: ModalManagerInterface) {
    const { urlParameters, useQuery } = useUrlParams();
    const { school, schoolName } = urlParameters;
    const { saveTei, loading: saving } = useSaveTei();
    const { sectionName } = useGetSectionTypeLabel();
    const admission = useQuery.get("admission") as string
    const [refetch, setRefetch] = useRecoilState(TableDataRefetch);
    const trackedEntity = useQuery.get("trackedEntity") as string
    const { program: programData, dataStoreData } = useGetSelectedKeys()
    const { attributes = [] } = useGetAttributes({ programData: programData! });
    const programStagesToSave = useGetUsedProgramStages({ sectionType: sectionName });
    const { errorLoading, returnPattern, loadingCodes, generatedVariables } = useGetPatternCode();
    const { open, setOpen, saveMode, initialValues: initialValuesFromSearch, formFields = [], formVariablesFields, setFormInitialValues, i18n } = props;
    const { getInitialValues, initialValues: updateInitialValues, loading: initialValuesLoading, admissionEvents } = useGetAdmissionUpdateInitialValues()

    let allInitialValues = {
        orgUnit: school,
        registerschoolstaticform: schoolName,
        admission_date: format(new Date(), "yyyy-MM-dd"),
    }

    const [values, setValues] = useState<{ [key: string]: any }>({ ...allInitialValues });

    const { runRulesEngine, updatedVariables } = RulesEngine({
        values: values,
        variables: formFields,
        program: programData!.id,
        type: "programStageSection",
    })


    useEffect(() => {
        runRulesEngine({ overrideVariables: formFields, overrideValues: values })
    }, [values])

    useEffect(() => {
        if (open && saveMode == "CREATE")
            void returnPattern(attributes, school);

        if (open && saveMode == "UPDATE")
            void getInitialValues(trackedEntity, admission);
    }, [open]);

    useEffect(() => {
        return () => {
            if (!open)
                setValues({});
            setFormInitialValues && setFormInitialValues({})
        }
    }, [open])

    const handleCloseModal = () => setOpen(false);

    const handleChange = (e: { field: any; value: string; name: string }) => {
        // const { name, value } = e;
        // setValues(prev => ({
        //     ...allInitialValues,
        //     ...prev,
        //     [name]: value,
        // }));
    };


    function onSubmit(e: Record<string, any>): void {
        const data = () => {
            if (saveMode === "CREATE") {
                return admissionPostBody({
                    values: e,
                    orgUnitId: school!,
                    programStagesToSave,
                    programId: programData?.id!,
                    formVariablesFields: formVariablesFields,
                    admissionDate: e?.admission_date,
                    trackedEntityType: programData?.trackedEntityType?.id!,
                    trackedEntityId: initialValuesFromSearch!["trackedEntity"]
                });
            }

            if (saveMode === "UPDATE") {
                return admissionUpdateBody({
                    formVariablesFields: formVariablesFields,
                    admissionId: e?.admission,
                    admissionDate: e?.admission_date,
                    trackedEntityId: e?.trackedEntity,
                    trackedEntityType: programData?.trackedEntityType?.id!,
                    orgUnitId: school!,
                    programId: programData?.id!,
                    formValues: e,
                    events: admissionEvents?.events,
                });
            }
        };

        saveTei({
            data: data(),
            messages: {
                error: `${i18n.t("Could not conclude the opertation.")}`,
                sucess: `${i18n.t("Operation concluded successfully")}`,
            },
            handleComplete: () => { handleCloseModal(); setRefetch(!refetch) },
        });
    }

    if (errorLoading) {
        handleCloseModal();
        return;
    }

    return (
        <ModalComponent
            open={open}
            handleClose={handleCloseModal}
            loading={loadingCodes || initialValuesLoading}
            title={i18n.t('Single {{section}} Admission {{mode}}', {
                section: i18n.t(sectionName),
                mode: saveMode === 'UPDATE' ? i18n.t('Update') : ''
            })}
        >
            <ModalContent
                loading={saving!}
                onSubmit={onSubmit}
                formValues={values}
                onChange={handleChange}
                setFormValues={setValues}
                onCancel={handleCloseModal}
                formFields={updatedVariables}
                trackedEntity={trackedEntity}
                initialValues={{
                    ...allInitialValues,
                    ...generatedVariables,
                    ...updateInitialValues,
                    ...initialValuesFromSearch,
                }}
            />
        </ModalComponent>
    );
}

export default ModalManager;