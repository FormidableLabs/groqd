import {definePlugin} from "sanity";
import {route} from "sanity/router";

export const groqdTool = definePlugin(() => {
	return {
		name: "groqd-playground",
		tools: [
			{
				name: "groqd-playground",
				title: "GROQD",
				component: () => null,
				options: {},
				router: route.create("/*")
			}
		]
	}
});
