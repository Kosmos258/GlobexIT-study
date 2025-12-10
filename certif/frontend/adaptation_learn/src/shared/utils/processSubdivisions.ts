import { Subdivision } from '@shared/types/wt-objects/subdivision';

export const processSubdivisions = (
	subdivisions: Subdivision[],
	query: string,
) => {
	return subdivisions
		.filter((subdivision) =>
			subdivision.name?.toLowerCase().includes(query.toLowerCase()),
		)
		.sort();
};
