import { useSchoolCalendarKey } from "dhis2-semis-components";
import { enrollmentDates, getAcademicYearOptions, useGetLearnerEnrollments, type TransitionPlan } from "dhis2-semis-functions";
import useGetSelectedKeys from "../config/useGetSelectedKeys";

// Plans enrolling admitted students in an academic year from their existing enrollments (any school):
// fill the admission-only enrollment, complete an earlier ACTIVE one, or report a conflict.
export function usePlanAdmissionEnrollment({ academicYearDataElement, currentAcademicYear }: { academicYearDataElement: string, currentAcademicYear?: string }) {
    const { planEnrollments } = useGetLearnerEnrollments()
    const { program: programData, dataStoreData } = useGetSelectedKeys()
    const schoolCalendar = useSchoolCalendarKey()

    async function planAdmissionEnrollment({ trackedEntities, academicYear, enrollmentDate }: { trackedEntities: string[], academicYear: string, enrollmentDate?: string }): Promise<{
        plans: Map<string, TransitionPlan>, dates: { enrolledAt?: string, occurredAt?: string }, calendarFound: boolean
    }> {
        const calendars = schoolCalendar?.schoolCalendar ?? []
        const options = getAcademicYearOptions(programData, academicYearDataElement)
        const { plans } = await planEnrollments({
            trackedEntities,
            program: programData?.id as string,
            targetAcademicYear: academicYear,
            currentAcademicYear: currentAcademicYear ?? schoolCalendar?.defaults?.academicYear ?? academicYear,
            registrationStage: dataStoreData?.registration?.programStage,
            academicYearDataElement,
            years: { calendars, options },
        })
        const { calendarFound, ...dates } = enrollmentDates({ calendar: calendars, academicYear, enrollmentDate, options })
        return { plans, dates, calendarFound }
    }

    return { planAdmissionEnrollment }
}
