interface Pers {
	id: XmlElem<number>;
	person_fullname: XmlElem<string>;
	person_position: XmlElem<string>;
	status: XmlElem<string>;
}

function selectAll<T>(query: string) {
	return ArraySelectAll<T>(tools.xquery(`sql: ${query}`));
}

try {
	const getSQL = selectAll<Pers>(`
             SELECT 
                crs.id, 
                crs.person_fullname, 
                crs.person_position, 
                crs.status
            FROM dbo.career_reserves crs
            WHERE crs.status = 'passed' 
            AND crs.position_type = 'adaptation';
    `);

	const result = getSQL.map((item) => ({
		id: item.id.Value,
		person_fullname: item.person_fullname.Value,
		person_position: item.person_position.Value,
		status: item.status.Value,
	}));

	RESULT = result;

	if (result.length === 0) {
		MESSAGE;
	}
} catch (error) {
	throw new Error(error.message);
}
