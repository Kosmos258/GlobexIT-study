import { ISubdivision } from "../types/subdivision/subdivision";

export const processSubdivisions = (subdivisions: ISubdivision[], query: string) => {
    return subdivisions.filter(subdivision => subdivision.name?.toLowerCase().includes(query.toLowerCase())).sort()
}