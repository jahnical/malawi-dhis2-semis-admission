import { planEnrollmentTransition } from "dhis2-semis-functions";
import { enrollmentPostBody } from "./formatEnrollmentPostBody";
import { admissionUpdateBody } from "../admission/formatAdmissionUpdateBody";

const REG = "REG", AY = "AY"
const formVariablesFields = [
    [{ id: "name", type: "attribute" }],
    [{ id: AY, type: "dataElement", programStage: REG }, { id: "grade", type: "dataElement", programStage: REG }],
]
const base = {
    programId: "P1", orgUnitId: "S1", enrollmentDate: "2025-09-15", trackedEntityType: "TT", trackedEntityId: "T1",
    formVariablesFields, values: { name: "Ada", [AY]: "2025/2026", grade: "1" }, programStagesToSave: ["TERM1"],
    dates: { enrolledAt: "2025-09-15", occurredAt: "2025-09-08" },
}
const plan = (existing: any[], target = "2025/2026") => planEnrollmentTransition({
    existing, targetAcademicYear: target, currentAcademicYear: "2025/2026", registrationStage: REG, academicYearDataElement: AY,
})

test("fills the admission-only enrollment, ACTIVE, dated to the academic year", () => {
    const body = enrollmentPostBody({ ...base, plan: plan([{ enrollment: "E0", status: "ACTIVE", orgUnit: "S1", events: [] }]) })
    const [enrollment] = body.trackedEntities[0].enrollments
    expect(body.trackedEntities[0].enrollments).toHaveLength(1)
    expect(enrollment).toMatchObject({ enrollment: "E0", status: "ACTIVE", enrolledAt: "2025-09-15", occurredAt: "2025-09-08", orgUnit: "S1" })
    expect((enrollment as any).events.map((e: any) => e.programStage)).toEqual([REG, "TERM1"])
})

test("completes the previous ACTIVE year in the same payload, keeping its dates", () => {
    const previous = { enrollment: "E1", status: "ACTIVE", orgUnit: "S0", enrolledAt: "2024-09-10", occurredAt: "2024-09-02", events: [{ programStage: REG, dataValues: [{ dataElement: AY, value: "2024/2025" }] }] }
    const enrollments = enrollmentPostBody({ ...base, plan: plan([previous]) }).trackedEntities[0].enrollments
    expect(enrollments[0]).toEqual({ enrollment: "E1", trackedEntity: "T1", program: "P1", orgUnit: "S0", status: "COMPLETED", enrolledAt: "2024-09-10", occurredAt: "2024-09-02" })
    expect(enrollments[1]).toMatchObject({ status: "ACTIVE", occurredAt: "2025-09-08" })
    expect((enrollments[1] as any).enrollment).toBeUndefined()
})

test("a future year is ACTIVE and a past year COMPLETED", () => {
    expect(enrollmentPostBody({ ...base, plan: plan([], "2026/2027") }).trackedEntities[0].enrollments[0].status).toBe("ACTIVE")
    expect(enrollmentPostBody({ ...base, plan: plan([], "2023/2024") }).trackedEntities[0].enrollments[0].status).toBe("COMPLETED")
})

test("editing an admission keeps the enrollment's status, org unit and dates", () => {
    const enrolled = { enrollment: "E1", status: "COMPLETED", orgUnit: "S0", enrolledAt: "2025-09-10", occurredAt: "2025-09-08", events: [{ programStage: REG }] }
    const common = { formVariablesFields, admissionId: "E1", trackedEntityId: "T1", trackedEntityType: "TT", orgUnitId: "S1", programId: "P1", formValues: { name: "Ada" }, registrationStage: REG }
    expect(admissionUpdateBody({ ...common, admissionDate: "2025-01-20", existingEnrollment: enrolled }).trackedEntities[0].enrollments[0])
        .toMatchObject({ status: "COMPLETED", orgUnit: "S0", enrolledAt: "2025-09-10", occurredAt: "2025-09-08" })

    // Admission-only: a changed admission date is the enrollment date
    const admissionOnly = { enrollment: "E1", status: "ACTIVE", orgUnit: "S1", enrolledAt: "2025-01-10", occurredAt: "2025-01-10", events: [] }
    expect(admissionUpdateBody({ ...common, admissionDate: "2025-01-20", existingEnrollment: admissionOnly }).trackedEntities[0].enrollments[0])
        .toMatchObject({ status: "ACTIVE", enrolledAt: "2025-01-20", occurredAt: "2025-01-20" })
})
