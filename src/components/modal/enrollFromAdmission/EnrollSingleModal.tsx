import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Form } from "react-final-form";
import { useRecoilState } from "recoil";
import { useConfig } from "@dhis2/app-runtime";
import { TableDataRefetch } from "dhis2-semis-types";
import { ModalComponent, useGetUsedProgramStages, WithBorder, WithPadding, CustomForm } from "dhis2-semis-components";
import { useSaveTei, useUrlParams, useGetSectionTypeLabel, useGetAttributes, useGetPatternCode, RulesEngine } from "dhis2-semis-functions";
import useGetSelectedKeys from "../../../hooks/config/useGetSelectedKeys";
import { enrollmentPostBody } from "../../../utils/enrollment/formatEnrollmentPostBody";

interface EnrollSingleModalProps {
    i18n: any;
    open: boolean;
    setOpen: (open: boolean) => void;
    trackedEntityId: string;
    enrollmentId?: string;
    activeEnrollmentToComplete?: string;
    activeEnrollmentEnrolledAt?: string;
    defaultAcademicYear?: string;
    academicYearDataElement?: string;
    initialValues?: Record<string, any>;
    formFields?: any;
    formVariablesFields?: any[];
    onComplete?: () => void;
}

function EnrollSingleModal({
    i18n, open, setOpen, trackedEntityId, enrollmentId, activeEnrollmentToComplete, activeEnrollmentEnrolledAt, defaultAcademicYear, academicYearDataElement,
    initialValues: externalInitialValues,
    formFields = [], formVariablesFields = [], onComplete
}: EnrollSingleModalProps) {
    const { baseUrl } = useConfig();
    const { urlParameters } = useUrlParams();
    const { school: orgUnitId, schoolName } = urlParameters;
    const { saveTei, loading: saving } = useSaveTei();
    const { sectionName } = useGetSectionTypeLabel();
    const [refetch, setRefetch] = useRecoilState(TableDataRefetch);
    const { program: programData } = useGetSelectedKeys();
    const programStagesToSave = useGetUsedProgramStages({ sectionType: sectionName });
    const { attributes = [] } = useGetAttributes({ programData: programData! });
    const { errorLoading, returnPattern, loadingCodes, generatedVariables } = useGetPatternCode();

    const defaultInitialValues: Record<string, any> = {
        orgUnit: orgUnitId,
        registerschoolstaticform: schoolName,
        enrollment_date: format(new Date(), "yyyy-MM-dd"),
    };

    const [values, setValues] = useState<Record<string, any>>({ ...defaultInitialValues });

    const { runRulesEngine, updatedVariables } = RulesEngine({
        values,
        variables: formFields,
        program: programData!.id,
        type: "programStageSection",
    });

    useEffect(() => {
        runRulesEngine({ overrideVariables: formFields, overrideValues: values });
    }, [values]);

    useEffect(() => {
        if (open && orgUnitId) {
            void returnPattern(attributes, orgUnitId);
        }
    }, [open]);

    useEffect(() => {
        return () => {
            if (!open) setValues({});
        };
    }, [open]);

    const handleClose = () => {
        setOpen(false);
        onComplete?.();
    };

    const handleChange = (_e: { field: any; value: string; name: string }) => {
        // Handled by CustomForm / react-final-form
    };

    function onSubmit(e: Record<string, any>): void {
        const data = enrollmentPostBody({
            values: e,
            orgUnitId: orgUnitId!,
            programStagesToSave,
            programId: programData?.id!,
            formVariablesFields,
            enrollmentDate: e?.enrollment_date,
            trackedEntityType: programData?.trackedEntityType?.id!,
            trackedEntityId,
            enrollmentId,
            activeEnrollmentToComplete,
            activeEnrollmentEnrolledAt,
            defaultAcademicYear,
            academicYearDataElement,
        });

        saveTei({
            data,
            messages: {
                error: i18n.t("Could not complete enrollment."),
                sucess: i18n.t("Student enrolled successfully"),
            },
            handleComplete: () => {
                setRefetch((prev: boolean) => !prev);
                handleClose();
            },
        });
    }

    if (errorLoading) {
        handleClose();
        return null;
    }

    return (
        <ModalComponent
            open={open}
            handleClose={handleClose}
            loading={loadingCodes}
            title={i18n.t("Enroll Admitted {{section}}", { section: i18n.t(sectionName) })}
        >
            <WithPadding>
                <WithBorder type="all">
                    <WithPadding>
                        <CustomForm
                            Form={Form}
                            loading={saving!}
                            trackedEntity={trackedEntityId}
                            baseUrl={baseUrl}
                            withButtons={true}
                            formValues={values}
                            formFields={updatedVariables}
                            onInputChange={handleChange}
                            setFormValues={setValues}
                            initialValues={{
                                ...defaultInitialValues,
                                ...generatedVariables,
                                ...externalInitialValues,
                            }}
                            onCancel={handleClose}
                            onFormSubtmit={(e: Record<string, any>) => { onSubmit(e); }}
                        />
                    </WithPadding>
                </WithBorder>
            </WithPadding>
        </ModalComponent>
    );
}

export default EnrollSingleModal;
