import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Form } from "react-final-form";
import { useRecoilState } from "recoil";
import { useConfig } from "@dhis2/app-runtime";
import { TableDataRefetch } from "dhis2-semis-types";
import { ModalComponent, useGetUsedProgramStages, WithBorder, WithPadding, CustomForm } from "dhis2-semis-components";
import { useSaveTei, useUrlParams, useGetSectionTypeLabel, useGetAttributes, useGetPatternCode, RulesEngine, getSectionLabels } from "dhis2-semis-functions";
import useGetSelectedKeys from "../../../hooks/config/useGetSelectedKeys";
import { enrollmentPostBody } from "../../../utils/enrollment/formatEnrollmentPostBody";
import { useEnrollmentYearValidation, useShowAlerts, TRANSITION_CONFLICT_MESSAGES } from 'dhis2-semis-functions';
import { useSchoolCalendarKey } from 'dhis2-semis-components';
import { usePlanAdmissionEnrollment } from "../../../hooks/enrollment/usePlanAdmissionEnrollment";

interface EnrollSingleModalProps {
    i18n: any;
    open: boolean;
    setOpen: (open: boolean) => void;
    trackedEntityId: string;
    defaultAcademicYear?: string;
    academicYearDataElement?: string;
    initialValues?: Record<string, any>;
    formFields?: any;
    formVariablesFields?: any[];
    onComplete?: () => void;
}

function EnrollSingleModal({
    i18n, open, setOpen, trackedEntityId, defaultAcademicYear, academicYearDataElement,
    initialValues: externalInitialValues,
    formFields = [], formVariablesFields = [], onComplete
}: EnrollSingleModalProps) {
    const { baseUrl } = useConfig();
    const { urlParameters } = useUrlParams();
    const { school: orgUnitId, schoolName } = urlParameters;
    const { saveTei, loading: saving } = useSaveTei();
    const { sectionName } = useGetSectionTypeLabel();
    const sectionLabels = getSectionLabels(sectionName, i18n);
    const [refetch, setRefetch] = useRecoilState(TableDataRefetch);
    const { program: programData, dataStoreData } = useGetSelectedKeys();
    const schoolCalendar = useSchoolCalendarKey();
    const enrollmentAcademicYearField = academicYearDataElement || dataStoreData.registration.academicYear || schoolCalendar?.academicYear;
    const validateYear = useEnrollmentYearValidation();
    const { show } = useShowAlerts();
    const [validating, setValidating] = useState(false);
    const { planAdmissionEnrollment } = usePlanAdmissionEnrollment({ academicYearDataElement: enrollmentAcademicYearField, currentAcademicYear: defaultAcademicYear });
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

    async function onSubmit(e: Record<string, any>) {
        setValidating(true);
        let prepared: Awaited<ReturnType<typeof planAdmissionEnrollment>>;
        try {
            await validateYear({ students: [{ trackedEntity: trackedEntityId }], enrollmentYear: e[enrollmentAcademicYearField], dataStore: dataStoreData, calendars: schoolCalendar?.schoolCalendar, programConfig: programData, academicYearField: enrollmentAcademicYearField, sectionType: sectionName });
        } catch {
            // The validation hook displays the error beside the Academic Year field.
            setValidating(false);
            return;
        }
        try {
            try {
                prepared = await planAdmissionEnrollment({ trackedEntities: [trackedEntityId], academicYear: e[enrollmentAcademicYearField], enrollmentDate: e?.enrollment_date });
            } catch {
                throw new Error("Could not check existing enrollments. Please try again.");
            }
        } catch (error: any) {
            // Not a field problem (the enrollment check failed), so show it as an alert
            show({ message: i18n.t(error.message), type: { critical: true } });
            return;
        } finally {
            setValidating(false);
        }

        const plan = prepared.plans.get(trackedEntityId)!;
        if (plan.conflict) {
            show({ message: i18n.t(TRANSITION_CONFLICT_MESSAGES[plan.conflict]), type: { critical: true } });
            return;
        }
        if (!prepared.calendarFound) {
            show({ message: i18n.t("The academic year is not in the school calendar. The enrollment date is used as its start date."), type: { warning: true } });
        }

        const data = enrollmentPostBody({
            values: e,
            orgUnitId: orgUnitId!,
            programStagesToSave,
            programId: programData?.id!,
            formVariablesFields,
            enrollmentDate: e?.enrollment_date,
            trackedEntityType: programData?.trackedEntityType?.id!,
            trackedEntityId,
            plan,
            dates: prepared.dates,
        });

        saveTei({
            data,
            program: programData,
            messages: {
                error: i18n.t("Could not complete enrollment."),
                sucess: i18n.t("Learner enrolled successfully"),
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
            title={i18n.t("Enroll Admitted {{section}}", { section: sectionLabels.title })}
        >
            <WithPadding>
                <WithBorder type="all">
                    <WithPadding>
                        <CustomForm
                            Form={Form}
                            loading={saving || validating}
                            trackedEntity={trackedEntityId}
                            baseUrl={baseUrl}
                            withButtons={true}
                            formValues={values}
                            formFields={validateYear.withFieldError(updatedVariables, enrollmentAcademicYearField, values[enrollmentAcademicYearField], message => i18n.t(message))}
                            onInputChange={handleChange}
                            setFormValues={setValues}
                            initialValues={{
                                ...defaultInitialValues,
                                ...generatedVariables,
                                ...externalInitialValues,
                            }}
                            onCancel={handleClose}
                            onFormSubtmit={onSubmit}
                        />
                    </WithPadding>
                </WithBorder>
            </WithPadding>
        </ModalComponent>
    );
}

export default EnrollSingleModal;
