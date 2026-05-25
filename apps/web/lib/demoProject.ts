import project from "../../../examples/demo-project/storeshot.project.json";
import { StoreShotProjectSchema } from "@openstoreshot/core";

export const demoProject = StoreShotProjectSchema.parse(project);
