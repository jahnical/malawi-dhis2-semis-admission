import { format } from "date-fns";
import { reducer } from "../common/formatDistinctValue";

interface admissionUpdateBodyInterface {
    programId: string,
    orgUnitId: string,
    admissionDate: string,
    trackedEntityId: string,
    trackedEntityType: string,
    formValues: Record<string, any>,
    admissionId: string,
    events: any[],
    formVariablesFields: any[],
}

export const admissionUpdateBody = ({ formVariablesFields, admissionId, admissionDate, trackedEntityId, trackedEntityType, orgUnitId, programId, formValues, events }: admissionUpdateBodyInterface): any => {
    const form: { attributes: any[], events: any[] } = {
        attributes: [],
        events: []
    }

    for (const data of formVariablesFields) {
        if (!data || !data.length) continue;

        if (data[0]?.type === "attribute") {
            data.forEach((attribute: { id: string }) => {
                const value = formValues[attribute.id];
                if (value !== null && value !== undefined) {
                    form.attributes.push({ attribute: attribute.id, value });
                }
            })
        }
        else if (data[0]?.type === "dataElement") {
            for (const [key, value] of Object.entries(reducer(data, formValues))) {
                const event = events?.find((event: any) => event.programStage === key)
                if (event && Object.keys(event).length > 4)
                    form.events.push({
                        ...event,
                        occurredAt: admissionDate,
                        scheduledAt: admissionDate,
                        createdAt: admissionDate,
                        dataValues: returnEventDataValues(value as Record<string, any>[])
                    })
                else
                    form.events.push({
                        notes: [],
                        orgUnit: orgUnitId,
                        status: "COMPLETED",
                        programStage: key,
                        program: programId,
                        admission: event?.admission,
                        trackedEntity: trackedEntityId,
                        dataValues: returnEventDataValues(value as Record<string, any>[]),
                        occurredAt: format(new Date(admissionDate), "yyyy-MM-dd'T'HH:mm:ss.SSS"),
                        scheduledAt: format(new Date(admissionDate), "yyyy-MM-dd'T'HH:mm:ss.SSS"),
                        createdAt: format(new Date(admissionDate), "yyyy-MM-dd'T'HH:mm:ss.SSS"),
                    })
            }
        }

    }

    return {
        trackedEntities: [
            {
                admissions: [
                    {
                        orgUnit: orgUnitId,
                        program: programId,
                        status: "COMPLETED",
                        admission: admissionId,
                        attributes: form.attributes,
                        createdAt: admissionDate,
                        occurredAt: admissionDate,
                        enrolledAt: admissionDate,
                        events: form.events
                    }
                ],
                orgUnit: orgUnitId,
                trackedEntity: trackedEntityId,
                trackedEntityType,
            }
        ]
    }
}


const returnEventDataValues = (dataValues: Record<string, any>[]) => {
    return dataValues.map(({ dataElement, value }) => ({
        dataElement,
        ...(value !== null && value !== undefined ? { value } : {})
    }));
};