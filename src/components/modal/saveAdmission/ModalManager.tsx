import { format } from "date-fns";
import { useRecoilState } from "recoil";
import ModalContent from "./ModalContent";
import React, { useEffect, useState } from "react";
import EnrollSingleModal from "../enrollFromAdmission/EnrollSingleModal";
import { TableDataRefetch } from "dhis2-semis-types"
import { ModalManagerInterface } from "../../../types/modal/ModalProps";
import useGetSelectedKeys from "../../../hooks/config/useGetSelectedKeys";
import { ModalComponent } from "dhis2-semis-components";
import { admissionPostBody, admissionUpdateBody } from "../../../utils/admission";
import useGetAdmissionUpdateInitialValues from "../../../hooks/form/useGetAdmissionUpdateInitialValues";
import { useGetAttributes, useGetPatternCode, useSaveTei, useUrlParams, useGetSectionTypeLabel, RulesEngine, useGetPatternCodeParams, applyAcademicYearPrefix } from "dhis2-semis-functions";
import { useDataEngine } from "@dhis2/app-runtime";

const GENERATE_TEI_ATTRIBUTE: any = {
    results: {
        resource: "trackedEntityAttributes",
        id: ({ id }: { id: string }) => `${id}/generate`,
        params: ({ params }: { params: object }) => ({
            ...params,
            expiration: 3
        })
    }
}


function ModalManager(props: ModalManagerInterface) {
    const engine = useDataEngine()
    const { urlParameters, useQuery } = useUrlParams();
    const { school, schoolName } = urlParameters;
    const { saveTei, loading: saving } = useSaveTei();
    const { sectionName } = useGetSectionTypeLabel();
    const admission = useQuery.get("admission") as string
    const [refetch, setRefetch] = useRecoilState(TableDataRefetch);
    const trackedEntity = useQuery.get("trackedEntity") as string
    const { program: programData, dataStoreData } = useGetSelectedKeys()
    const { attributes = [] } = useGetAttributes({ programData: programData! });
    const { errorLoading, returnPattern, loadingCodes, generatedVariables } = useGetPatternCode();
    const { getPatternCodeParams } = useGetPatternCodeParams();
    const { open, setOpen, saveMode, initialValues: initialValuesFromSearch, formFields = [], formVariablesFields, setFormInitialValues, i18n } = props;
    const { getInitialValues, initialValues: updateInitialValues, loading: initialValuesLoading } = useGetAdmissionUpdateInitialValues()

    const admissionDateAttrId = dataStoreData?.admission?.admissionDate;
    const studentIdentifierAttrId = dataStoreData?.admission?.studentIdentifier;
    const replaceYearPrefix = (dataStoreData as any)?.admission?.replaceIdentifierYearPrefix === true;
    let allInitialValues = {
        orgUnit: school,
        registerschoolstaticform: schoolName ?? "",
        ...(admissionDateAttrId
            ? { [admissionDateAttrId]: format(new Date(), "yyyy-MM-dd") }
            : { admission_date: format(new Date(), "yyyy-MM-dd") }),
    }

    const [values, setValues] = useState<{ [key: string]: any }>({ ...allInitialValues });
    const [showEnrollPrompt, setShowEnrollPrompt] = useState(false);
    const [admittedTeiId, setAdmittedTeiId] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);

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
        if (open && saveMode == "CREATE") {
            // Exclude the student identifier attribute from auto-generation on modal open
            // so the user can type their own value. It will be generated on submit if left empty.
            const attributesForPatternGen = studentIdentifierAttrId
                ? attributes.filter((attr) => attr.id !== studentIdentifierAttrId)
                : attributes;
            void returnPattern(attributesForPatternGen, school!);
        }

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

    /**
     * Generate a value for the student identifier attribute using the DHIS2 API.
     * Uses the attribute's configured pattern (e.g. RANDOM(XXXXXX), ORG_UNIT_CODE(...), etc.)
     */
    async function generateIdentifierValue(): Promise<string | null> {
        if (!studentIdentifierAttrId) return null;

        const identifierAttr = attributes.find((attr) => attr.id === studentIdentifierAttrId);
        if (!identifierAttr?.pattern) return null;

        try {
            const params = await getPatternCodeParams({
                pattern: identifierAttr.pattern,
                orgUnit: school!,
                params: {},
                onFail: () => { }
            });
            const result = await engine.query(GENERATE_TEI_ATTRIBUTE, {
                variables: { id: studentIdentifierAttrId, params }
            }) as any;
            return result?.results?.value ?? null;
        } catch (error) {
            console.error("Failed to generate student identifier:", error);
            return null;
        }
    }


    async function onSubmit(e: Record<string, any>): Promise<void> {
        setSubmitting(true);
        const formValues = { ...e };

        // If the student identifier attribute is configured and the user left it empty,
        // auto-generate a value before submitting.
        if (studentIdentifierAttrId && !formValues[studentIdentifierAttrId]) {
            const generatedId = await generateIdentifierValue();
            if (generatedId) {
                formValues[studentIdentifierAttrId] = generatedId;
            }
        }

        // If year prefix replacement is enabled, apply next-year prefix from admission date
        if (replaceYearPrefix && studentIdentifierAttrId && formValues[studentIdentifierAttrId]) {
            const admDate = (admissionDateAttrId ? formValues[admissionDateAttrId] : formValues?.admission_date) || format(new Date(), "yyyy-MM-dd");
            formValues[studentIdentifierAttrId] = applyAcademicYearPrefix(
                formValues[studentIdentifierAttrId],
                admDate
            );
        }

        const teiIdForEnrollment: string = initialValuesFromSearch?.["trackedEntity"] ?? "";

        const data = () => {
            if (saveMode === "CREATE") {
                return admissionPostBody({
                    values: formValues,
                    orgUnitId: school!,
                    programId: programData?.id!,
                    formVariablesFields: formVariablesFields,
                    admissionDate: (admissionDateAttrId ? formValues?.[admissionDateAttrId] : formValues?.admission_date) || format(new Date(), "yyyy-MM-dd"),
                    trackedEntityType: programData?.trackedEntityType?.id!,
                    trackedEntityId: initialValuesFromSearch!["trackedEntity"]
                });
            }

            if (saveMode === "UPDATE") {
                return admissionUpdateBody({
                    formVariablesFields: formVariablesFields,
                    admissionId: formValues?.admission,
                    admissionDate: (admissionDateAttrId ? formValues?.[admissionDateAttrId] : formValues?.admission_date) || format(new Date(), "yyyy-MM-dd"),
                    trackedEntityId: formValues?.trackedEntity,
                    trackedEntityType: programData?.trackedEntityType?.id!,
                    orgUnitId: school!,
                    programId: programData?.id!,
                    formValues: formValues,
                });
            }
        };

        saveTei({
            data: data(),
            messages: {
                error: `${i18n.t("Could not conclude the opertation.")}`,
                sucess: `${i18n.t("Operation concluded successfully")}`,
            },
            handleComplete: () => {
                setSubmitting(false);
                setRefetch(!refetch);
                if (saveMode === "CREATE" && teiIdForEnrollment) {
                    setAdmittedTeiId(teiIdForEnrollment);
                    handleCloseModal();
                    setShowEnrollPrompt(true);
                } else {
                    handleCloseModal();
                }
            },
        });
    }

    if (errorLoading) {
        handleCloseModal();
        return;
    }

    return (
        <>
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
                loading={saving! || submitting}
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

        {showEnrollPrompt && (
            <EnrollSingleModal
                i18n={i18n}
                open={showEnrollPrompt}
                setOpen={setShowEnrollPrompt}
                trackedEntityId={admittedTeiId}
                onComplete={() => setShowEnrollPrompt(false)}
            />
        )}
    </>
    );
}

export default ModalManager;