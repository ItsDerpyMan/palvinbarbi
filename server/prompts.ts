import { Checkbox, prompt, Select } from "@cliffy/prompt";
import { Table } from "@cliffy/table";

const table: Table = new Table(
  ["Baxter Herman", "Oct 1, 2020", "Harderwijk", "Slovenia"],
  ["Jescie Wolfe", "Dec 4, 2020", "Alto Hospicio", "Japan"],
  ["Allegra Cleveland", "Apr 16, 2020", "Avernas-le-Bauduin", "Samoa"],
  ["Aretha Gamble", "Feb 22, 2021", "Honolulu", "Georgia"],
);

const result = await prompt([{
  name: "terminal",
  message: "Would you rather console",
  type: Select,
  options: [
    { name: "rooms", value: "" },
    { name: "config", value: "" },
    { name: "new-room", value: "" },
    Select.separator("--------"),
    { name: "start", value: "" },
    { name: "stop", value: "" },
  ],
}, {
  name: "configuration",
  message: "Config",
  type: Checkbox,
  options: [
    { name: "Red", value: "#ff0000" },
    { name: "Green", value: "#00ff00", disabled: true },
    { name: "Blue", value: "#0000ff" },
    Checkbox.separator("--------"),
    { name: "White", value: "#ffffff" },
    { name: "Black", value: "#000000" },
  ],
}]);
console.log(result);
