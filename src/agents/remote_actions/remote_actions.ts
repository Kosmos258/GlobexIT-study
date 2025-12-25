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
			var aFlds = ParseJson(form_fields);

			tools.create_notification("7236243991256052588", curUser.id, aFlds[0].value);

			RESULT = {
				command: "alert",
				msg: "Сообщение успешно отправлено!",
				confirm_result: {
					command: "close_form",
				},
			};

			break;
	}
} catch (err) {
	ERROR = 1;
	MESSAGE = "Произошла ошибка при обработке запроса " + err.message;

	RESULT = {
		command: "alert",
		msg: "Ошибка: " + err.message,
	};
}
