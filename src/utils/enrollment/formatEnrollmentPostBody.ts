const reducer = (array: any[], values: any) => {
    return array.reduce(function (r, a) {
        r[a.programStage] = (r[a.programStage]) || [];
        if (a.id && values[a.id]) {
            r[a.programStage].push({ dataElement: a.id, value: values[a.id] });
        }
        else
            r[a.programStage].push({ dataElement: a.id, value: undefined });
        return r;
    }, Object.create(null));
}

interface enrollmentPostBodyInterface {
    programId: string,
    orgUnitId: string,
    enrollmentDate: string,
    trackedEntityId?: string,
    trackedEntityType: string,
    formVariablesFields: any[],
    values: Record<string, any>,
    programStagesToSave: (string | undefined)[],
    enrollmentId?: string,
    activeEnrollmentToComplete?: string,
    activeEnrollmentEnrolledAt?: string,
    defaultAcademicYear?: string,
    academicYearDataElement?: string,
}

export const enrollmentPostBody = ({ formVariablesFields, programId, orgUnitId, enrollmentDate, programStagesToSave, trackedEntityType, trackedEntityId, values, enrollmentId, activeEnrollmentToComplete, activeEnrollmentEnrolledAt, defaultAcademicYear, academicYearDataElement }: enrollmentPostBodyInterface) => {
    const form: { attributes: any[], events: any[] } = {
        attributes: [],
        events: []
    }

    for (const enrollmentData of formVariablesFields) {
        if (enrollmentData?.[0]?.type === "attribute") {
            enrollmentData.forEach((attribute: { id: string }) => {
                if (values[attribute.id]) {
                    form.attributes.push({ attribute: attribute.id, value: values[attribute.id] })
                }
            });
        } else if (enrollmentData?.[0]?.type === "dataElement") {
            for (const [key, value] of Object.entries(reducer(enrollmentData, values))) {
                form.events.push({
                    notes: [],
                    orgUnit: orgUnitId,
                    status: "ACTIVE",
                    program: programId,
                    programStage: key,
                    dataValues: value,
                    occurredAt: enrollmentDate,
                    scheduledAt: enrollmentDate,
                })
            }
        }
    }

    programStagesToSave.forEach(programStageToSave => {
        form.events.push({
            orgUnit: orgUnitId,
            notes: [],
            status: "ACTIVE",
            program: programId,
            occurredAt: enrollmentDate,
            scheduledAt: enrollmentDate,
            programStage: programStageToSave,
        })
    })

    // Determine enrollment status based on academic year:
    // If the form's academic year matches the default (current) academic year → ACTIVE
    // If it's for a past academic year → COMPLETED (that year has ended)
    const formAcademicYear = academicYearDataElement ? values[academicYearDataElement] : undefined;
    const enrollmentStatus = (defaultAcademicYear && formAcademicYear && String(formAcademicYear) !== String(defaultAcademicYear))
        ? "COMPLETED"
        : "ACTIVE";

    // Build enrollments array based on the scenario:
    // Scenario A: enrollmentId is set (admission-only, no events) → UPDATE existing enrollment
    // Scenario B: activeEnrollmentToComplete is set (has events from past year)
    //   → COMPLETE old enrollment + CREATE new enrollment in one payload
    // Scenario C: neither set (no ACTIVE enrollment) → CREATE new enrollment
    const enrollments: any[] = [];

    if (activeEnrollmentToComplete) {
        // First: complete the existing ACTIVE enrollment that has events from a past year
        enrollments.push({
            enrollment: activeEnrollmentToComplete,
            orgUnit: orgUnitId,
            program: programId,
            status: "COMPLETED",
            enrolledAt: activeEnrollmentEnrolledAt || enrollmentDate,
            occurredAt: activeEnrollmentEnrolledAt || enrollmentDate,
        });
        // Second: create a new enrollment with the submitted form data
        enrollments.push({
            orgUnit: orgUnitId,
            program: programId,
            status: enrollmentStatus,
            events: form?.events?.filter(event => event.programStage !== undefined),
            attributes: form.attributes,
            occurredAt: enrollmentDate,
            enrolledAt: enrollmentDate,
        });
    } else {
        // Single enrollment: either update existing (enrollmentId) or create new
        enrollments.push({
            ...(enrollmentId ? { enrollment: enrollmentId } : {}),
            orgUnit: orgUnitId,
            program: programId,
            status: enrollmentStatus,
            events: form?.events?.filter(event => event.programStage !== undefined),
            attributes: form.attributes,
            occurredAt: enrollmentDate,
            enrolledAt: enrollmentDate,
        });
    }

    return {
        trackedEntities: [
            {
                enrollments,
                orgUnit: orgUnitId,
                trackedEntityType,
                ...(trackedEntityId ? { trackedEntity: trackedEntityId } : {})
            }
        ]
    }
}
