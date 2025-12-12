try {
	switch (command) {
		case "eval":
			RESULT = {
				command: "display_form",
				title: "Написать сообщение",
				message: "Введите текст сообщения ниже:",
				form_fields: [
					{
						name: "msg_text",
						label: "Введите ваше сообщение",
						type: "text",
						mandatory: true,
						validation: "nonempty",
					},
					{
						name: "idTemplate",
						type: "hidden",
						value: "7231623806893854768",
					},
				],
				buttons: [
					{
						name: "submit",
						label: "Отправить",
						type: "submit",
						css_class: "btn-submit-custom",
					},
					{
						name: "cancel",
						label: "Отмена",
						type: "cancel",
					},
				],
			};
			break;

		case "submit_form":
			const aFlds = ParseJson(form_fields);

			let text = "";
			let templateId = "";
			const user = curUser.id;

			for (const field of aFlds) {
				if (field.type == "text") {
					text = field.value;
				}
				if (field.name == "idTemplate") {
					templateId = field.value;
				}
			}

			tools.create_notification(templateId, user, text);

			if (!text) {
				RESULT = {
					command: "alert",
					msg: "Сообщение не может быть пустым!",
				};
			} else {
				RESULT = {
					command: "alert",
					msg: "Сообщение успешно отправлено!",
					confirm_result: {
						command: "close_form",
					},
				};
			}
			break;
	}
} catch (err) {
	ERROR = 1;
	MESSAGE = "Произошла ошибка при обработке запроса";

	RESULT = {
		command: "alert",
		msg: "Ошибка: " + err.message,
	};
}
