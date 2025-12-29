declare const learningDoc: LearningDocumentTopElem;

/**
 * Выбирает все записи sql запроса
 * @param {string} query - sql-выражение
 */
function selectAll<T>(query: string) {
	return ArraySelectAll<T>(tools.xquery(`sql: ${query}`));
}

/**
 * Выбирает первую запись sql запроса
 * @param {string} query - sql-выражение
 * @param {any} defaultObj - значение по умолчанию
 */
function selectOne<T>(query: string, defaultObj: any = undefined) {
	return ArrayOptFirstElem<T>(tools.xquery(`sql: ${query}`), defaultObj);
}

const personId = learningDoc.person_id.Value;
const finishedCourseState = learningDoc.state_id.Value;

const allLearnings = selectAll<{ state_id: number }>(`
	SELECT 
		course_id, 
		course_name, 
		state_id
	FROM dbo.learnings
	WHERE person_id = '${personId}';
`);

const failedAttempts = allLearnings.filter(
	(l) => OptInt(l.state_id) !== 4,
).length;

if (failedAttempts < 3 && finishedCourseState === 4) {
	const newCourse = selectOne<{ id: XmlElem<number> }>(`
		SELECT 
			id
		FROM dbo.courses
		WHERE status = 'publish'
		ORDER BY RANDOM()
		LIMIT 1;
	`);

	tools.activate_course_to_person(personId, newCourse.id);
}
