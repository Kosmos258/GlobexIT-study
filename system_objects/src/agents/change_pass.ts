const idArr = OBJECTS_ID_STR.split(";");

function changePassword(id: string) {
	try {
		const collabDoc = tools.open_doc<CollaboratorDocument>(OptInt(id));
		if (collabDoc !== undefined) {
			const teCollab = collabDoc.TopElem;
			teCollab.password.Value = tools.make_password(
				String(Random(10000, 100000)),
				true
			);
			collabDoc.Save();
		}
	} catch (ex) {
		alert("changePassword: " + ex);
	}
}

function main() {
	for (let i = 0; i < idArr.length; i++) {
		changePassword(idArr[i]);
	}
}

main();
