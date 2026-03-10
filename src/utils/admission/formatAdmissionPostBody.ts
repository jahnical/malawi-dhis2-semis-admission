import { reducer } from "../common/formatDistinctValue";

interface admissionPostBodyInterface {
    programId: string,
    orgUnitId: string,
    admissionDate: string
    trackedEntityId?: string,
    trackedEntityType: string,
    formVariablesFields: any[],
    values: Record<string, any>,
    programStagesToSave: (string | undefined)[],
}

export const admissionPostBody = ({ formVariablesFields, programId, orgUnitId, admissionDate, programStagesToSave, trackedEntityType, trackedEntityId, values }: admissionPostBodyInterface) => {
    const form: { attributes: any[], events: any[] } = {
        attributes: [],
        events: []
    }

    for (const admissionData of formVariablesFields) {
        if (admissionData?.[0]?.type === "attribute") {
            admissionData.forEach((attribute: { id: string }) => {
                if (values[attribute.id]) {
                    form.attributes.push({ attribute: attribute.id, value: values[attribute.id] })
                }
            });
        } else if (admissionData?.[0]?.type === "dataElement") {
            for (const [key, value] of Object.entries(reducer(admissionData, values))) {
                form.events.push({
                    notes: [],
                    orgUnit: orgUnitId,
                    status: "ACTIVE",
                    program: programId,
                    programStage: key,
                    dataValues: value,
                    occurredAt: admissionDate,
                    scheduledAt: admissionDate,
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
            occurredAt: admissionDate,
            scheduledAt: admissionDate,
            programStage: programStageToSave,
        })
    })

    return {
        trackedEntities: [
            {
                admissions: [
                    {
                        orgUnit: orgUnitId,
                        program: programId,
                        status: "COMPLETED",
                        events: form?.events?.filter(event => event.programStage !== undefined),
                        attributes: form.attributes,
                        occurredAt: admissionDate,
                        enrolledAt: admissionDate,
                    }
                ],
                orgUnit: orgUnitId,
                trackedEntityType,
                ...(trackedEntityId ? { trackedEntity: trackedEntityId } : {})
            }
        ]
    }
}