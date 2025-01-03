const { mockFactory: mock } = require("./todo-list");

module.exports = () => {
  return {
    title: "ToDo List (with Draft content)",
    data: mock.datasetWithDraftContent(),
  };
};
