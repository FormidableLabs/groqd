---
sidebar_position: 3
---

# Query Building

`groqd` uses a builder pattern for building queries. Builder instances are created with a function `q`, and are chainable. There are four internal classes that are used as part of the query builder process: `UnknownQuery`, `ArrayQuery`, `UnknownArrayQuery`, and `EntityQuery`. These four classes have _some_ overlap, but generally only contain methods that "make sense" for the type of result they represent (e.g. `ArrayQuery` will contain methods that an `EntityQuery` will not, such as filtering and ordering).

## The `q` method

## `.filter`

TODO:

## `.grab`

TODO:

## `.grab$`

TODO:

## `.grabOne`

TODO:

## `.grabOne$`

TODO:

## `.slice`

TODO:

## `.order`

TODO:

## `.deref`

TODO:

## `.score`

TODO:

## `.nullable`

TODO:
