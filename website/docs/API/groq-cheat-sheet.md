# Query Cheat Sheet - GROQD

Here are some typical queries in GroqD (TypeScript).
These examples were adapted from the [GROQ Cheat Sheet](https://www.sanity.io/docs/query-cheat-sheet)

<!--
You can also check out [our introduction to GROQ](/docs/content-lake/how-queries-work) and [the complete reference documentation](/docs/groq). To actually run queries you can:

- Hit your content lake's query [HTTP endpoint](/docs/http-reference/query) directly
- Use the [JavaScript](/docs/js-client) or [PHP](/docs/php-client) SDKs, or [another client](https://www.sanity.io/exchange/type=plugins/solution=apis)
- Install the [Vision plugin](/docs/content-lake/the-vision-plugin) that runs queries right inside Sanity Studio
- Go to [groq.dev](https://groq.dev) to run queries against any JSON dataset

> [!WARNING]
> Gotcha
> If your query doesn't work as expected, it might be related to:
>
> API versioning
>
> Perspectives
-->

## Filters

> [!TIP]
> Protip
> You will get null as a value on a query if the key you ask for doesn't exist. That means you can filter on key != null to check if it exists with a value or not.

```typescript
// Everything, i.e. all documents
q.star

// All movie documents
q.star.filterByType("movie")

// _id equals
q.star.filterBy('_id == "abc.123"')

// _type is movie or person
q.star.filterByType("movie", "person")

// multiple filters AND
q.star.filterByType("movie").filterBy("popularity > 15").filterBy('releaseDate == "2016-04-25"')

// multiple filters OR
q.star.filterByType("movie").filterBy('popularity > 15', 'releaseDate == "2016-04-25"')

q.star.filterByType("movie")
  // less than
  .filterBy('popularity < 15')
  // greater than
  .filterBy('popularity > 15')
  // less than or equal
  .filterBy('popularity <= 15')
  // greater than or equal
  .filterBy('popularity >= 15')
  // equal
  .filterBy('popularity == 15')
  // not equal
  .filterBy('releaseDate != "2016-04-27"')

// Use zulu-time when comparing datetimes to strings
q.star.filterRaw('dateTime(_updatedAt) > dateTime("2018-04-20T20:43:31Z")')

// Updated within the past week
q.star.filterRaw('dateTime(_updatedAt) > dateTime(now()) - 60*60*24*7')

// Records whose name precedes "Baker" alphabetically
q.star.filterRaw('name < "Baker"')

// match boolean
q.star.filterBy('awardWinner')

// true if awardWinner == true
q.star.filterBy('awardWinner')

// true if awardWinner == false
q.star.filterBy('!awardWinner')

// has been assigned an award winner status (any kind of value)
q.star.filterBy('defined(awardWinner)')

// has not been assigned an award winner status (any kind of value)
q.star.filterBy('!defined(awardWinner)')

// title equals
q.star.filterBy('title == "Aliens"')

// title in list
q.star.filterRaw('title in ["Aliens", "Interstellar", "Passengers"]')

// _id matches a.b.c.d but not a.b.c.d.e
q.star.filterRaw('_id in path("a.b.c.*")')

// _id matches a.b.c.d, and also a.b.c.d.e.f.g, but not a.b.x.1
q.star.filterRaw('_id in path("a.b.c.**")')

// _id matches anything that is not under the a.b.c path or deeper
q.star.filterRaw('!(_id in path("a.b.c.**"))')

// documents that have the string "yolo" in the array "tags"
q.star.filterRaw('"yolo" in tags')

// the string field status is either == "completed" or "archived"
q.star.filterRaw('status in ["completed", "archived"]')

// Any document having a castMember referencing sigourney as its person
q.star.filterRaw('"person_sigourney-weaver" in castMembers[].person._ref')

// nested properties
q.star.filterBy('slug.current == "some-slug"')

// documents that reference categories with slugs of "action" or "thriller"
q.star.filterRaw('count((categories[]->slug.current)[@ in ["action", "thriller"]]) > 0')

// documents that reference categories with slugs of "action" and "thriller"
q.star.filterRaw('count((categories[]->slug.current)[@ in ["action", "thriller"]]) == 2')
```

## Text matching

> [!WARNING]
> Gotcha
> The match operator is designed for human-language text and might not do what you expect!

```typescript
// Text contains the word "word"
q.star.filter('text match "word"')

// Title contains a word starting with "wo"
q.star.filter('title match "wo*"')

// Inverse of the previous query; animal matches the start of the word "caterpillar"
q.star.filter('"caterpillar" match animal + "*"')

// Title and body combined contains a word starting with "wo" and the full word "zero"
q.star.filter('[title, body] match ["wo*", "zero"]')

// Are there aliens in my rich text?
q.star.filter('body[].children[].text match "aliens"')

// Note: match operates on tokens!
```

## Slice Operations

> [!TIP]
> Protip
> There is no default limit, meaning that if you're not explicit about slice, you'll get everything.

```typescript
// a single movie (an object is returned, not an array)
q.star.filterByType("movie").slice(0)

// first 6 movies (inclusive)
q.star.filterByType("movie").slice(0, 5, true)

// first 5 movies (non-inclusive)
q.star.filterByType("movie").slice(0, 5)

// first 10 movie titles
q.star.filterByType("movie").project({ title: true }).slice(0, 10)

// first 10 movie titles (alternative order)
q.star.filterByType("movie").slice(0, 10).project({ title: true })

// first 10 movie titles, offset by 10
q.star.filterByType("movie").slice(10, 20).project({ title: true })

// all movies are returned (no slice specified)
q.star.filterByType("movie")
```

**Also note**: The above queries don't make much sense without also specifying an order. E.g. the "first 6 movies" query only returns "first" movies in the sense that these are the first six movies the backend happens to pull out.

## Ordering

> [!TIP]
> Protip
> Documents are returned by default in ascending order by _id, which may not be what you're after. If you're querying for a subset of your documents, it's usually a good idea to specify an order.
>
> No matter what sort order is specified, the ascending order by _id will always remain the final tie-breaker.

```typescript
// order results
q.star.filterByType("movie").order("_createdAt asc")

// order results by multiple attributes
q.star.filterByType("movie").order("releaseDate desc").order("_createdAt asc")

// order todo items by descending priority, then most recently updated
q.star.filterByType("todo").order("priority desc, _updatedAt desc")

// the single, oldest document
q.star.filterByType("movie").order("_createdAt asc").slice(0)

// the single, newest document
q.star.filterByType("movie").order("_createdAt desc").slice(0)

// oldest 10 documents
q.star.filterByType("movie").order("_createdAt asc").slice(0, 10)

// BEWARE! This selects 10 documents using the default ordering, and *only the selection* is ordered by _createdAt in ascending order
q.star.filterByType("movie").slice(0, 10).order("_createdAt asc")

// limit/offset using external params (see client documentation)
q.star.filterByType("movie").order("_createdAt asc").slice("$start", "$end")

// order results alphabetically by a string field
q.star.filterByType("movie").order("title asc")

// order results alphabetically by a string field, ignoring case
q.star.filterByType("movie").order("lower(title) asc")
```

## Joins

```typescript
// Fetch movies with title, and join with poster asset with path + url
q.star.filterByType("movie").project({
  title: true,
  poster: q.field("poster").project({
    asset: q.field("asset").deref().project({
      path: true,
      url: true,
    }),
  }),
})

// Say castMembers is an array containing objects with character name and a reference to the person:
// We want to fetch movie with title and an attribute named "cast" which is an array of actor names
q.star.filterByType("movie").project({
  title: true,
  cast: q.field("castMembers[]").field("person").deref().field("name"),
})

// Same query as above, except "cast" now contains objects with person._id and person.name
q.star.filterByType("movie").project({
  title: true,
  cast: q.field("castMembers[]").field("person").deref().project({
    _id: true,
    name: true,
  }),
})

// Using the ^ operator to refer to the enclosing document. Here ^._id refers to the id
// of the enclosing person record.
q.star.filterByType("person").project((q) => ({
  name: true,
  relatedMovies: q
    .groq('*[_type=="movie" && references(^._id)]')
    .project({ title: true }),
}))

// Books by author.name (book.author is a reference)
q.star
  .filter('_type == "book" && author._ref in *[_type=="author" && name=="John Doe"]._id')
  .project({ /* ... */ })
```

## Objects and Arrays

```typescript
// Create your own objects
const qPeopleByPrizeYear = q.star.order("prizes[0].year desc").project({
  name: q.field("firstname").groq('+ " " +').field("surname"),
  orderYear: q.field("prizes[0].year"),
  prizes: true,
})

const qAllPrizes = q.star.field("prizes[]").order("year desc")

// Get all Nobel prizes from all root person documents
q.star.field("prizes[]")

// Array helpers (use groq functions via .groq())
q.field("tags").groq('array::join(@, ", ")')
q.groq('array::join(["a", "b", "c"], ".")')
q.field("year").groq('array::join(@, ".")')
q.field("values").groq('array::join(@, 1)')
q.field("numbers").groq('array::compact(@)')
q.field("items").groq('array::unique(@)')
q.field("records").groq('array::unique(@)')
q.groq('array::intersects(firstList, secondList)')
q.groq('array::intersects(tags, keywords)')
```

## Object Projections

```typescript
// return only title
q.star.filterByType("movie").project({ title: true })

// return values for multiple attributes
q.star.filterByType("movie").project({ _id: true, _type: true, title: true })

// explicitly name the return field for _id
q.star.filterByType("movie").project({ renamedId: "._id", _type: true, title: true })

// Return an array of attribute values (no object wrapper)
q.star.filterByType("movie").field("title")
q.star.filterByType("movie").project({ characterNames: q.field("castMembers[]").field("characterName") })

// movie titled Arrival and its posterUrl
q.star.filter('_type=="movie" && title == "Arrival"').project({
  title: true,
  posterUrl: q.field("poster").field("asset").deref().field("url"),
})

// Explicitly return all attributes
q.star.filterByType("movie").project({ "...": true })

// Some computed attributes, then also add all attributes of the result
q.star.filterByType("movie").project({
  posterUrl: q.field("poster").field("asset").deref().field("url"),
  "...": true,
})

// Default values when missing or null in document
q.star.filterByType("movie").project({
  "...": true,
  rating: q.groq('coalesce(rating, "unknown")'),
})

// Number of elements in array 'actors' on each movie
q.star.filterByType("movie").project({
  actorCount: q.groq('count(actors)'),
})

// Apply a projection to every member of an array
q.star.filterByType("movie").project({
  castMembers: q.field("castMembers[]").project({
    characterName: true,
    person: true,
  }),
})

// Filter embedded objects
q.star.filterByType("movie").project({
  castMembers: q.field('castMembers[characterName match "Ripley"]').project({
    characterName: true,
    person: true,
  }),
})

// Follow every reference in an array of references
q.star.filterByType("book").project({
  authors: q.field("authors[]").deref().project({
    name: true,
    bio: true,
  }),
})

// Explicity name the outer return field
qRoot.project({
  threeMovieTitles: q.star.filterByType("movie").slice(0, 2).field("title"),
})

// Combining several unrelated queries in one request
qRoot.project({
  featuredMovie: q.star.filter('_type == "movie" && title == "Alien"').slice(0),
  scifiMovies: q.star.filter('_type == "movie" && "sci-fi" in genres'),
})
```

## Special variables

```typescript
// * (everything)
q.star

// @ (root value of the scope)
q.star.filter('@["1"]')
q.star.filter('@[$prop]._ref == $refId')
q.project({
  arraySizes: q.field("arrays[]").project({
    size: q.groq("count(@)"),
  }),
})

// ^ (enclosing document)
q.star.filterByType("person").project((q) => ({
  name: true,
  relatedMovies: q
    .groq('*[_type=="movie" && references(^._id)]')
    .project({ title: true }),
}))
```

## Conditionals

```typescript
// select() returns the first => pair whose left-hand side evaluates to true
q.star.filterByType("movie").project({
  "...": true,
  popularity: q.groq('select(popularity > 20 => "high", popularity > 10 => "medium", popularity <= 10 => "low")'),
})

// The first select() parameter without => is returned if no previous matches are found
q.star.filterByType("movie").project({
  "...": true,
  popularity: q.groq('select(popularity > 20 => "high", popularity > 10 => "medium", "low")'),
})

// Projections also have syntactic sugar for inline conditionals
q.star.filterByType("movie").project((q) => ({
  "...": true,
  ...q.groq(`releaseDate >= '2018-06-01' => {
    "screenings": *[_type == 'screening' && movie._ref == ^._id],
    "news": *[_type == 'news' && movie._ref == ^._id],
  }`),
  ...q.groq(`popularity > 20 && rating > 7.0 => {
    "featured": true,
    "awards": *[_type == 'award' && movie._ref == ^._id],
  }`),
}))

// The above is exactly equivalent to:
q.star.filterByType("movie").project((q) => ({
  "...": true,
  ...q.groq(`...select(releaseDate >= '2018-06-01' => {
    "screenings": *[_type == 'screening' && movie._ref == ^._id],
    "news": *[_type == 'news' && movie._ref == ^._id],
  })`),
  ...q.groq(`...select(popularity > 20 && rating > 7.0 => {
    "featured": true,
    "awards": *[_type == 'award' && movie._ref == ^._id],
  })`),
}))

// Specify sets of projections for different content types in an array
q.field("content[]").project((q) => ({
  ...q.groq(`_type == 'type1' => {
    // Your selection of fields for type1
  },
  _type == 'type2' => {
    // Your selection of fields for type2
    "url": file.asset->url
  }`),
}))
```

### Handling references conditionally

In cases where an array contains both [references and non-references](https://www.sanity.io/docs/array-type#wT47gyCx), it's often desirable for a groqd query to conditionally return the inline object (where dealing with non-references) or the referenced document (where dealing with references). This can be done by considering the `_type` of each array item and dereferencing the item (`@->`) if it's a reference or getting the whole object (`@`) if it's not a reference.

```typescript
q.project({
  content: q.field("content[]").project((q) => ({
    ...q.groq(`_type == 'reference' => @->, _type != 'reference' => @`),
  })),
})
```

## Functions

```typescript
// any document that references the document with id person_sigourney-weaver, return only title
q.star.filter('references("person_sigourney-weaver")').project({ title: true })

// Movies which reference ancient people
q.star.filter('_type=="movie" && references(*[_type=="person" && age > 99]._id)').project({ title: true })

// any document that has the attribute 'tags'
q.star.filter('defined(tags)')

// coalesce takes a number of attribute references and returns the value of the first attribute that is non-null
q.project({
  title: q.groq('coalesce(title.fi, title.en)'),
})

// count counts the number of items in a collection
q.groq('count(*[_type == "movie" && rating == "R"])')

// Counts the number of elements in the array actors
q.star.filterByType("movie").project({
  title: true,
  actorCount: q.groq('count(actors)'),
})

// round() rounds number to the nearest integer, or the given number of decimals
q.groq('round(3.14)')
q.groq('round(3.14, 1)')

// score() adds points to the score value depending on the use of the string "GROQ" in each post's description
q.star.filterByType("post")
  .score('description match "GROQ"')
  .order("_score desc")
  .project({ _score: true, title: true })

// boost() adds a defined boost integer to scores of items matching a condition
q.star.filter('_type == "movie" && movieRating > 3')
  .score('title match $term', 'boost(movieRating > 8, 3)')

// Creates a scoring system where $term matching in the title is worth more than matching in the body
q.star.filter('_type == "movie" && movieRating > 3')
  .score('boost(title match $term, 4)', 'boost(body match $term, 1)')

// Returns the body Portable Text data as plain text
q.star.filterByType("post").project({
  plaintextBody: q.groq('pt::text(body)'),
})

// Get all versions and drafts of a document. Use with the raw perspective or a perspective stack to ensure accurate results.
q.star.filter('sanity::versionOf("document-id")')

// Get all documents that are part of a release. Use with the raw perspective to ensure accurate results.
q.star.filter('sanity::partOfRelease("release-id")')
```

## Geolocation

```typescript
// Returns all documents that are storefronts within 10 miles of the user-provided currentLocation parameter
q.star.filter('_type == "storefront" && geo::distance(geoPoint, $currentLocation) < 16093.4')

// For a given $currentLocation geopoint and deliveryZone area
// Return stores that deliver to a user's location
q.star.filter('_type == "storefront" && geo::contains(deliveryZone, $currentLocation)')

// Creates a "marathonRoutes" array that contains all marathons whose routes intersect with the current neighborhood
q.star.filterByType("neighborhood").project({
  marathonRoutes: q.star.filter('_type == "marathon" && geo::intersects(^.neighborhoodRegion, routeLine)'),
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
