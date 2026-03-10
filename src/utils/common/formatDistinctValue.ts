export const reducer = (array: any[], values: any) => {
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
