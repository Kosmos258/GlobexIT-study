declare const learningDoc: LearningDocumentTopElem;

interface IError {
	code: number;
	message: string;
}

/**
 * Создает поток ошибки с объектом error
 * @param {string} source - источник ошибки
 * @param {IError} errorObject - объект ошибки
 */
function HttpError(source: string, errorObject: IError) {
	throw new Error(source + " -> " + errorObject.message);
}

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

try {
	const personId = learningDoc.person_id.Value;
	learningDoc.state_id.Value;

	const allLearnings = selectAll<{ state_id: XmlElem<number>; }>(`
			SELECT 
                course_id, 
                course_name, 
                state_id
			FROM dbo.learnings
			WHERE person_id = '${personId}';
		`);

	allLearnings.filter(
		(l) => OptInt(l.state_id.Value) !== 4,
	).length;


	const newCourse = selectOne<{ id: XmlElem<number>; }>(`
			SELECT 
                id
			FROM dbo.courses
			WHERE status = 'publish'
			ORDER BY RANDOM()
			LIMIT 1;
		`);

	tools.activate_course_to_person(personId, newCourse.id.Value);
} catch (error) {
	throw HttpError("Handler", {
		code: 500,
		message: error.message,
	});
}
