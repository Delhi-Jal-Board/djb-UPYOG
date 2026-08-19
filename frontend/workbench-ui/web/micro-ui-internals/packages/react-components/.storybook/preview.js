import "@djb25/workbench-ui-css/example/index.css";
import { initLibraries } from "@djb25/workbench-ui-libraries";

// TODO: It should be removed bcz we should not use any library in components
initLibraries();

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
};
