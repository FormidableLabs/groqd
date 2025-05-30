---
sidebar_position: 10
---

# GroqD Cheat Sheet

Here are some typical queries in GroqD (TypeScript).
These examples were adapted from the [GROQ Cheat Sheet](https://www.sanity.io/docs/query-cheat-sheet)

## Filters

### `filterByType(_type, ..._type)`

Use `filterByType` to retrieve the appropriate documents.
The `_type` is a **strongly-typed** string, representing one of your document types.

```typescript
// Everything, i.e. all documents
q.star

// All movie documents
q.star.filterByType("movie")

// _type is movie or person
q.star.filterByType("movie", "person")

// multiple filters AND
q.star.filterByType("movie").filterBy("popularity > 15").filterBy('releaseDate == "2016-04-25"')

// multiple filters OR
q.star.filterByType("movie").filterBy('popularity > 15', 'releaseDate == "2016-04-25"')

```

### `filterBy(expression, ...expression)`

Use `filterBy` to filter the documents.  
The `expression` is a **strongly-typed** string. 

> This method is strongly-typed, so it only supports basic GROQ expressions, like `slug.current == "abc"` or `value > 10`.
> Use `filterRaw` for more complex expressions.

```typescript
q.star.filterByType("movie") // gives us a strongly-typed `.filterBy` method 
  .filterBy('_id == "abc.123"') // _id equals
  .filterBy('popularity < 15') // less than
  .filterBy('popularity > 15') // greater than
  .filterBy('popularity <= 15') // less than or equal
  .filterBy('popularity >= 15') // greater than or equal
  .filterBy('popularity == 15') // equal
  .filterBy('releaseDate != "2016-04-27"') // not equal
  .filterBy('awardWinner') // match boolean
  .filterBy('awardWinner') // true if awardWinner == true
  .filterBy('!awardWinner') // true if awardWinner == false
  .filterBy('title == "Aliens"') // title equals
  .filterBy('slug.current == "some-slug"') // nested properties
```

### `filterRaw(expression, ...expression)`
Use `filterRaw` for expressions that are more complex than `filterBy` supports.  
The `expression` is **NOT strongly-typed**; any string is allowed.


```typescript

q.star.filterByType("movie")
  .filterRaw('dateTime(_updatedAt) > dateTime("2018-04-20T20:43:31Z")') // Use zulu-time when comparing datetimes to strings
  .filterRaw('dateTime(_updatedAt) > dateTime(now()) - 60*60*24*7') // Updated within the past week
  .filterRaw('name < "Baker"') // Records whose name precedes "Baker" alphabetically
  .filterRaw('title in ["Aliens", "Interstellar", "Passengers"]') // title in list
  .filterRaw('_id in path("a.b.c.*")') // _id matches a.b.c.d but not a.b.c.d.e
  .filterRaw('_id in path("a.b.c.**")') // _id matches a.b.c.d, and also a.b.c.d.e.f.g, but not a.b.x.1
  .filterRaw('!(_id in path("a.b.c.**"))') // _id matches anything that is not under the a.b.c path or deeper
  .filterRaw('"yolo" in tags') // documents that have the string "yolo" in the array "tags"
  .filterRaw('status in ["completed", "archived"]') // the string field status is either == "completed" or "archived"
  .filterRaw('"person_sigourney-weaver" in castMembers[].person._ref') // Any document having a castMember referencing sigourney as its person
  .filterRaw('count((categories[]->slug.current)[@ in ["action", "thriller"]]) > 0') // documents that reference categories with slugs of "action" or "thriller"
  .filterRaw('count((categories[]->slug.current)[@ in ["action", "thriller"]]) == 2') // documents that reference categories with slugs of "action" and "thriller"
  .filterRaw('defined(awardWinner)') // has been assigned an award winner status (any kind of value)
  .filterRaw('!defined(awardWinner)') // has not been assigned an award winner status (any kind of value)

```

## Text matching

> [!WARNING]
> Gotcha
> The match operator is designed for human-language text and might not do what you expect!

GroqD does not have strongly-typed support for text matching, so simply use `.filterRaw`:

```typescript
q.star.filterRaw('text match "word"') // Text contains the word "word"
q.star.filterRaw('title match "wo*"') // Title contains a word starting with "wo"
q.star.filterRaw('"caterpillar" match animal + "*"') // Inverse of the previous query; animal matches the start of the word "caterpillar"
q.star.filterRaw('[title, body] match ["wo*", "zero"]') // Title and body combined contains a word starting with "wo" and the full word "zero"
q.star.filterRaw('body[].children[].text match "aliens"') // Are there aliens in my rich text?
// Note how match operates on tokens!
q.star.filterRaw('"foo bar" match "fo*"')  // -> true
q.star.filterRaw('"my-pretty-pony-123.jpg" match "my*.jpg" ') // -> false
```

## Slice Operations

> [!TIP]
> Protip
> There is no default limit, meaning that if you're not explicit about slice, you'll get everything.

```typescript
q.star.filterByType("movie").slice(0) // a single movie (an object is returned, not an array)
q.star.filterByType("movie").slice(0, 5, true) // first 6 movies (inclusive)
q.star.filterByType("movie").slice(0, 5) // first 5 movies (non-inclusive)
q.star.filterByType("movie").project({ title: true }).slice(0, 10) // first 10 movie titles
q.star.filterByType("movie").slice(0, 10).project({ title: true }) // first 10 movie titles (alternative order)
q.star.filterByType("movie").slice(10, 20).project({ title: true }) // first 10 movie titles, offset by 10
q.star.filterByType("movie") // all movies are returned (no slice specified)
```

**Also note**: The above queries don't make much sense without also specifying an order. E.g. the "first 6 movies" query only returns "first" movies in the sense that these are the first six movies the backend happens to pull out.

## Ordering

> [!TIP]
> Protip
> Documents are returned by default in ascending order by _id, which may not be what you're after. If you're querying for a subset of your documents, it's usually a good idea to specify an order.
>
> No matter what sort order is specified, the ascending order by _id will always remain the final tie-breaker.

```typescript
q.star.filterByType("movie").order("_createdAt asc") // order results
q.star.filterByType("movie").order("releaseDate desc", "_createdAt asc") // order results by multiple attributes
q.star.filterByType("todo").order("priority desc", "_updatedAt desc") // order todo items by descending priority, then most recently updated
q.star.filterByType("movie").order("_createdAt asc").slice(0) // the single, oldest document
q.star.filterByType("movie").order("_createdAt desc").slice(0) // the single, newest document
q.star.filterByType("movie").order("_createdAt asc").slice(0, 10) // oldest 10 documents
q.star.filterByType("movie").slice(0, 10).order("_createdAt asc") // BEWARE! This selects 10 documents using the default ordering, and *only the selection* is ordered by _createdAt in ascending order
q.star.filterByType("movie").order("_createdAt asc").slice(0, 10) // selects the first 10 created documents
q.star.filterByType("movie").order("title asc") // order results alphabetically by a string field
q.star.filterByType("movie").raw("| order(lower(title) asc)", "passthrough") // order results alphabetically by a string field, ignoring case (TODO: implement 'orderRaw' instead of this)
```

## Joins

```typescript
// Fetch movies with title, and join with poster asset with path + url
q.star.filterByType("movie").project(q => ({
  title: true,
  poster: q.field("poster").project(q => ({
    asset: q.field("asset").deref().project({
      path: true,
      url: true,
    }),
  })),
}))

// Say castMembers is an array containing objects with character name and a reference to the person:
// We want to fetch movie with title and an attribute named "cast" which is an array of actor names
q.star.filterByType("movie").project(q => ({
  title: true,
  cast: q.field("castMembers[].person").deref().field("name"),
}))

// Same query as above, except "cast" now contains objects with person._id and person.name
q.star.filterByType("movie").project(q => ({
  title: true,
  cast: q.field("castMembers[].person").deref().project({
    _id: true,
    name: true,
  }),
}))

// Using the ^ operator to refer to the enclosing document. Here ^._id refers to the id
// of the enclosing person record.
q.star.filterByType("person").project(q => ({
  name: true,
  relatedMovies: q.star
    .filterByType("movie")
    .filterBy("references(^._id)")
    .project({ title: true }),
}))

// Books by author.name (book.author is a reference)
q.star.filterByType("book")
  .filterRaw('author._ref in *[_type=="author" && name=="John Doe"]._id')
  .project({ /* ... */ })
```

## Objects and Arrays

```typescript
// Create your own objects
q.project(q => ({
  // People ordered by Nobel prize year
  peopleByPrizeYear: q.star.order("prizes[0].year desc").project(q => ({
    name: q.raw('firstname + " " + surname'),
    orderYear: q.field("prizes[0].year"),
    prizes: true
  })),
  // List of all prizes ordered by year awarded
  allPrizes: q.star.field("prizes[]").order("year desc")
}))


// Get all Nobel prizes from all root person documents
q.star.filterByType("person").field("prizes[]")

// Array helpers (use groq functions via .raw())
q.raw<string>('array::join(tags, ", ")') // tags = ["Rust", "Go", null, "GROQ"] => "Rust, Go, <INVALID>, GROQ"
q.raw<string>('array::join(["a", "b", "c"], ".")') // "a.b.c"
q.raw<string|null>('array::join(year, ".")') // year = 2024 => null (not an array)
q.raw<null>('array::join(values, 1)') // values = [10, 20, 30] => null (separator must be a string)
q.raw<number[]>('array::compact(numbers)') // numbers = [1, null, 2, null, 3] => [1, 2, 3]
q.raw<number[]>('array::unique(items)') // items = [1, 2, 2, 3, 4, 5, 5] => [1, 2, 3, 4, 5]
q.raw<number[][]>('array::unique(records)') // records = [[1], [1]] => [[1], [1]] (arrays are not comparable)
q.raw<boolean>('array::intersects(firstList, secondList)') // firstList = [1, 2, 3], secondList = [3, 4, 5] => true
q.raw<boolean>('array::intersects(tags, keywords)') // tags = ["tech", "science"], keywords = ["art", "design"] => false
```

## Object Projections

```typescript
// return only title
q.star.filterByType("movie").project({ title: true })

// return values for multiple attributes
q.star.filterByType("movie").project({ _id: true, _type: true, title: true })

// explicitly name the return field for _id
q.star.filterByType("movie").project({ renamedId: "_id", _type: true, title: true })

// Return an array of attribute values (no object wrapper)
q.star.filterByType("movie").field("title")
q.star.filterByType("movie").project(q => ({ 
  characterNames: q.field("castMembers[].characterName")
}))

// movie titled Arrival and its posterUrl
q.star.filterByType("movie").filterBy('title == "Arrival"').project(q => ({
  title: true,
  posterUrl: q.field("poster.asset").deref().field("url"),
}))

// Explicitly return all attributes
q.star.filterByType("movie").project({ "...": true })

// Some computed attributes, then also add all attributes of the result
q.star.filterByType("movie").project(q => ({
  posterUrl: q.field("poster.asset").deref().field("url"),
  "...": true,
}))

// Default values when missing or null in document
q.star.filterByType("movie").project(q => ({
  "...": true,
  rating: q.coalesce("rating", q.value("unknown")),
}))

// Number of elements in array 'actors' on each movie
q.star.filterByType("movie").project(q => ({
  actorCount: q.count("actors"),
}))

// Apply a projection to every member of an array
q.star.filterByType("movie").project(q => ({
  castMembers: q.field("castMembers[]").project({
    characterName: true,
    person: true,
  }),
}))

// Filter embedded objects
q.star.filterByType("movie").project(q => ({
  castMembers: q.field("castMembers[]").filterRaw('characterName match "Ripley"').project({
    characterName: true,
    person: true,
  }),
}))

// Follow every reference in an array of references
q.star.filterByType("book").project(q => ({
  authors: q.field("authors[]").deref().project({
    name: true,
    bio: true,
  }),
}))

// Explicity name the outer return field
q.project({
  threeMovieTitles: q.star.filterByType("movie").slice(0, 2).field("title"),
})

// Combining several unrelated queries in one request
q.project({
  featuredMovie: q.star.filterByType("movie").filterBy('title == "Alien"').slice(0),
  scifiMovies: q.star.filterByType("movie").filterBy('"sci-fi" in genres'),
})
```

## Special variables

```typescript
// *
q.star // Everything, i.e. all documents

// @
// @ refers to the root value (document) of the scope

q.star.filterRaw('@["1"]')
q.star.filterRaw('@[$prop]._ref == $refId') // Select reference prop from an outside variable.
q.star.project(q => ({
  arraySizes: q.field("arrays[]").project(q => ({
    size: q.count("@"), // @ also works for nested scopes
  })),
}))

// ^
// ^ refers to the enclosing document. Here ^._id refers to the id
// of the enclosing person record.
q.star.filterByType("person").project((q) => ({
  name: true,
  relatedMovies: q.star
    .filterByType("movie")
    .filterBy("references(^._id)")
    .project({ title: true }),
}))
```

## Conditionals

```typescript
// select() returns the first => pair whose left-hand side evaluates to true
q.star.filterByType("movie").project(q => ({
  "...": true,
  popularity: q.select({
    "popularity > 20": q.value("high"),
    "popularity > 10": q.value("medium"),
    "popularity <= 10": q.value("low"),
  }),
}))

// The second parameter to select() is returned if no previous matches are found
q.star.filterByType("movie").project(q => ({
  "...": true,
  popularity: q.select({
    "popularity > 20": q.value("high"),
    "popularity > 10": q.value("medium"),
    // Default value if no conditions match:
  }, q.value("low")),
}))

// Projections also have syntactic sugar for inline conditionals
q.star.filterByType("movie").project((q) => ({
  "...": true,
  ...q.conditional({
    "releaseDate >= '2018-06-01'": q.project({
      screenings: q.star.filterByType("screening").filterBy('movie._ref == ^._id'),
      news: q.star.filterByType("news").filterBy('movie._ref == ^._id'),
    }),
    "popularity > 20 && rating > 7.0": q.project({
      featured: q.value(true),
      awards: q.star.filterByType("award").filterBy('movie._ref == ^._id'),
    }),
  }),
}))

// Specify sets of projections for different content types in an object
q.field("content[]").project((q) => ({
  ...q.conditionalByType({
    type1: q => ({
      // Your selection of fields for type1
    }),
    type2: q => ({
      // Your selection of fields for type2
      url: q.field("file.asset").deref().field("url"),
    }),
  }),
}))
```

### Handling references conditionally

In cases where an array contains both [references and non-references](https://www.sanity.io/docs/array-type#wT47gyCx), it's often desirable for a groqd query to conditionally return the inline object (where dealing with non-references) or the referenced document (where dealing with references). This can be done by considering the `_type` of each array item and dereferencing the item (`@->`) if it's a reference or getting the whole object (`@`) if it's not a reference.

```typescript
q.project({
  content: q.field("content[]").project((q) => ({
    ...q.conditionalByType({
      reference: q => q.field("@").deref(),
      item: q => q.field("@"),
    }),
  })),
})
```

## Functions

```typescript
// any document that references the document with id person_sigourney-weaver, return only title
q.star.filterRaw('references("person_sigourney-weaver")').project({ title: true })

// Movies which reference ancient people
q.star.filterByType("movie").filterRaw('references(*[_type=="person" && age > 99]._id)').project({ title: true })

// any document that has the attribute 'tags'
q.star.filterRaw('defined(tags)')

// coalesce takes a number of attribute references and returns the value of the first attribute that is non-null
q.star.project(q => ({
  title: q.coalesce("title.fi", "title.en"),
}))

// count counts the number of items in a collection
q.count(q.star.filterByType("movie").filterBy("rating == 'R'"))

// Counts the number of elements in the array actors
q.star.filterByType("movie").project(q => ({
  title: true,
  actorCount: q.count("actors[]"),
}))

// round() rounds number to the nearest integer, or the given number of decimals
q.raw<number>('round(3.14)')
q.raw<number>('round(3.14, 1)')

// score() adds points to the score value depending on the use of the string "GROQ" in each post's description
q.star.filterByType("post")
  .scoreRaw('description match "GROQ"')
  .order("_score desc")
  .project({ _score: true, title: true })

// boost() adds a defined boost integer to scores of items matching a condition
q.star.filterByType("movie").filterBy('movieRating > 3')
  .scoreRaw('title match $term', 'boost(movieRating > 8, 3)')

// Creates a scoring system where $term matching in the title is worth more than matching in the body
q.star.filterByType("movie").filterBy('movieRating > 3')
  .scoreRaw('boost(title match $term, 4)', 'boost(body match $term, 1)')

// Returns the body Portable Text data as plain text
q.star.filterByType("post").project({
  plaintextBody: q.raw<string>('pt::text(body)'),
})

// Get all versions and drafts of a document. Use with the raw perspective or a perspective stack to ensure accurate results.
q.star.filterRaw('sanity::versionOf("document-id")')

// Get all documents that are part of a release. Use with the raw perspective to ensure accurate results.
q.star.filterRaw('sanity::partOfRelease("release-id")')
```

## Geolocation

```typescript
// Returns all documents that are storefronts within 10 miles of the user-provided currentLocation parameter
q.star.filterByType("storefront").filterRaw('geo::distance(geoPoint, $currentLocation) < 16093.4')

// For a given $currentLocation geopoint and deliveryZone area
// Return stores that deliver to a user's location
q.star.filterByType("storefront").filterBy('geo::contains(deliveryZone, $currentLocation)')

// Creates a "marathonRoutes" array that contains all marathons whose routes intersect with the current neighborhood
q.star.filterByType("neighborhood").project({
  marathonRoutes: q.star.filterByType("marathon").filterBy('geo::intersects(^.neighborhoodRegion, routeLine)'),
})
```

## Arithmetic and Concatenation

```typescript
// Standard arithmetic operations are supported
q.raw<number>('1 + 2')  // 3 (addition)
q.raw<number>('3 - 2')  // 1 (subtraction)
q.raw<number>('2 * 3')  // 6 (multiplication)
q.raw<number>('8 / 4')  // 2 (division)
q.raw<number>('2 ** 4') // 16 (exponentiation)
q.raw<number>('8 % 3')  // 2 (modulo)

// Exponentiation can be used to take square- and cube-roots too
q.raw<number>('9 ** (1/2)')  // 3 (square root)
q.raw<number>('27 ** (1/3)') // 3 (cube root)

// + can also concatenate strings, arrays, and objects:
q.raw<string>('"abc" + "def"') // "abcdef"
q.raw<number[]>('[1,2] + [3,4]') // [1,2,3,4]
q.raw<{a:number,b:number,c:number}>('{"a":1,"b":2} + {"c":3}') // {"a":1,"b":2,"c":3}

// Concatenation of a string and a number requires the number be converted to a string. Otherwise, the operation returns null
q.raw<null>('3 + " p.m."')         // null
q.raw<string>('string(3) + " p.m."') // "3 p.m."
```
