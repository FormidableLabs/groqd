const { faker } = require("@faker-js/faker");

/** @import { MyObject1 } from './File1.js' */

/**
 * @typedef {import('../../src/arcade/playground/todo-list/todo-list.sanity.types').User} User
 * @typedef {import('../../src/arcade/playground/todo-list/todo-list.sanity.types').Todo} Todo
 *
 */

/**
 */
const mock = {
  _idMap: {},
  id(prefix) {
    if (!this._idMap[prefix]) {
      this._idMap[prefix] = 0;
    }
    const index = ++this._idMap[prefix];
    return prefix + index;
  },
  /**
   * @param {User} data
   * @returns {User}
   */
  user(data) {
    return {
      _type: "user",
      _id: mock.id("user."),
      name: faker.name.firstName(),
      ...data,
    };
  },
  /**
   * @param {Todo} data
   * @returns {Todo}
   */
  todoItem(data) {
    return {
      _type: "todo",
      _id: mock.id("todo."),
      user: null,
      title: faker.hacker.phrase(),
      completed: faker.datatype.boolean(),
      ...data,
    };
  },
  array(count, fill) {
    return new Array(count).fill(null).map(fill);
  },
  ref(_id) {
    return { _type: "reference", _ref: _id };
  },
  dataset() {
    faker.seed(10000);

    const numUsers = 5;
    const dataset = [];

    for (let i = 0; i < numUsers; i++) {
      const user = mock.user({});

      const numItems = faker.datatype.number({ min: 2, max: 5 });
      const items = mock.array(numItems, () =>
        mock.todoItem({
          user: mock.ref(user._id),
        })
      );

      dataset.push(user, ...items);
    }

    return dataset;
  },
  datasetWithDraftContent() {
    const data = mock.dataset();

    const draftUser = mock.user({
      name: "User with Draft Content",
    });

    /**
     * @param {{_type: string, _id: string, completed: boolean, title: string, user: null}} data
     */
    const draftItem = (data) =>
      mock.todoItem({
        _id: mock.id("draft.item."),
        title: mock.id("Draft Item "),
        user: mock.ref(draftUser._id),
        ...data,
      });

    const draftData = [
      draftUser,
      draftItem({ completed: null }),
      draftItem({ completed: 55 }),
      draftItem({ user: null }),
      draftItem({ title: null }),
    ];

    return [...data, ...draftData];
  },
};

module.exports = () => {
  return {
    title: "Todo List",
    data: mock.dataset(),
  };
};
module.exports.mockFactory = mock;
