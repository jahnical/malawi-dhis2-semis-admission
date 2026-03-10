import { D2I18n } from "dhis2-semis-types"

interface ModalContentInterface {
    formFields: any
    loading: boolean
    onCancel: () => void
    onSubmit: (arg: any) => void
    onChange: (arg: any) => void
    trackedEntity?: string,
    formValues?: Record<string, any>
    initialValues?: Record<string, any>
    setFormValues?: (arg: any) => void
}

interface ModalManagerInterface {
    open: boolean;
    formFields?: any;
    formVariablesFields?: any
    saveMode: "CREATE" | "UPDATE";
    setOpen: (arg: boolean) => void;
    initialValues?: Record<string, any>
    setFormInitialValues?: (arg: Record<string, any>) => void;
    i18n: D2I18n
}

export type { ModalContentInterface, ModalManagerInterface }