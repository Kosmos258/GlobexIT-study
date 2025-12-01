interface Pers {
	id: string;
	person_fullname: string;
	person_position: string;
	status: string;
}

function selectAll<T>(query: string) {
	return ArraySelectAll<T>(tools.xquery(`sql: ${query}`));
}

try {
	const getSQL = selectAll<Pers>(`
            SELECT 
                c.id, 
                c.person_fullname, 
                c.person_position, 
                c.status
            FROM dbo.career_reserves c
            WHERE c.status = 'passed' 
            AND c.position_type = 'adaptation';
    `);

	const result: Pers[] = getSQL.map((item) => ({
		id: RValue(item.id),
		person_fullname: RValue(item.person_fullname),
		person_position: RValue(item.person_position),
		status: item.status === "passed" ? "Пройдена" : RValue(item.status),
	}));

	RESULT = result;

	if (result.length === 0) {
		MESSAGE;
	}
} catch (error) {
	throw new Error(ERROR);
}

alert(tools.object_to_text(RESULT, "json"));
