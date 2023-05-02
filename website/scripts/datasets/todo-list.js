const { faker } = require("@faker-js/faker");
const { nanoid } = require("nanoid");

module.exports = () => {
  const numUsers = 10;
  const data = [];

  for (let i = 0; i < numUsers; i++) {
    const userId = nanoid();

    data.push({
      _type: "user",
      _id: userId,
      name: faker.name.firstName(),
    });

    const numItems = 5 + Math.floor(5 * Math.random());
    for (let j = 0; j < numItems; j++) {
      data.push({
        _id: nanoid(),
        user: { _type: "reference", _ref: userId },
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
