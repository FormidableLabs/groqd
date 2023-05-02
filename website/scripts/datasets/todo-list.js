const { faker } = require("@faker-js/faker");
const { nanoid } = require("nanoid");

module.exports = () => {
  const numUsers = 10;
  const data = [];

  for (let i = 0; i < numUsers; i++) {
    const userId = nanoid();
    const N = 5 + Math.floor(5 * Math.random());
    for (let j = 0; j < N; j++) {
      data.push({
        id: nanoid(),
        userId,
        title: faker.lorem.sentence(8),
        completed: Math.random() >= 0.5,
      });
    }
  }

  return {
    title: "Todo List",
    data,
  };
};
