# Query Cheat Sheet - GROQ

Here are some typical queries in GROQ. You can also check out [our introduction to GROQ](/docs/content-lake/how-queries-work) and [the complete reference documentation](/docs/groq). To actually run queries you can:

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

## Filters

> [!TIP]
> Protip
> You will get null as a value on a query if the key you ask for doesn't exist. That means you can filter on key != null to check if it exists with a value or not.

```groq
* // Everything, i.e. all documents
*[] // Everything with no filters applied, i.e. all documents
*[_type == "movie"] // All movie documents
*[_id == "abc.123"] // _id equals
*[_type in ["movie", "person"]] // _type is movie or person
*[_type == "movie" && popularity > 15 && releaseDate > "2016-04-25"] // multiple filters AND
*[_type == "movie" && (popularity > 15 || releaseDate > "2016-04-25")] // multiple filters OR
*[popularity < 15] // less than
*[popularity > 15] // greater than
*[popularity <= 15] // less than or equal
*[popularity >= 15] // greater than or equal
*[popularity == 15]
*[releaseDate != "2016-04-27"] // not equal
*[!(releaseDate == "2016-04-27")] // not equal
*[!(releaseDate != "2016-04-27")] // even equal via double negatives "not not equal"
*[dateTime(_updatedAt) > dateTime('2018-04-20T20:43:31Z')] // Use zulu-time when comparing datetimes to strings
*[dateTime(_updatedAt) > dateTime(now()) - 60*60*24*7] // Updated within the past week
*[name < "Baker"] // Records whose name precedes "Baker" alphabetically
*[awardWinner == true] // match boolean
*[awardWinner] // true if awardWinner == true
*[!awardWinner] // true if awardWinner == false
*[defined(awardWinner)] // has been assigned an award winner status (any kind of value)
*[!defined(awardWinner)] // has not been assigned an award winner status (any kind of value)
*[title == "Aliens"]
*[title in ["Aliens", "Interstellar", "Passengers"]]
*[_id in path("a.b.c.*")] // _id matches a.b.c.d but not a.b.c.d.e
*[_id in path("a.b.c.**")] // _id matches a.b.c.d, and also a.b.c.d.e.f.g, but not a.b.x.1
*[!(_id in path("a.b.c.**"))] // _id matches anything that is not under the a.b.c path or deeper
*["yolo" in tags] // documents that have the string "yolo" in the array "tags"
*[status in ["completed", "archived"]] // the string field status is either == "completed" or "archived"
*["person_sigourney-weaver" in castMembers[].person._ref] // Any document having a castMember referencing sigourney as its person
*[slug.current == "some-slug"] // nested properties
*[count((categories[]->slug.current)[@ in ["action", "thriller"]]) > 0] // documents that reference categories with slugs of "action" or "thriller"
*[count((categories[]->slug.current)[@ in ["action", "thriller"]]) == 2] // documents that reference categories with slugs of "action" and "thriller"
  // set == 2 based on the total number of items in the array
```

## Text matching

> [!WARNING]
> Gotcha
> The match operator is designed for human-language text and might not do what you expect!

```groq
// Text contains the word "word"
*[text match "word"]

// Title contains a word starting with "wo"
*[title match "wo*"] 

// Inverse of the previous query; animal matches the start of the word "caterpillar" (perhaps animal == "cat")
*["caterpillar" match animal + "*"] 

// Title and body combined contains a word starting with "wo" and the full word "zero"
*[[title, body] match ["wo*", "zero"]] 

// Are there aliens in my rich text?
*[body[].children[].text match "aliens"] 

// Note how match operates on tokens!
"foo bar" match "fo*"  // -> true
"my-pretty-pony-123.jpg" match "my*.jpg"  // -> false
```

## Slice Operations

> [!TIP]
> Protip
> There is no default limit, meaning that if you're not explicit about slice, you'll get everything.

```groq
*[_type == "movie"][0] // a single movie (an object is returned, not an array)
*[_type == "movie"][0..5] // first 6 movies (inclusive)
*[_type == "movie"][0...5] // first 5 movies (non-inclusive)
*[_type == "movie"]{title}[0...10] // first 10 movie titles
*[_type == "movie"][0...10]{title} // first 10 movie titles
*[_type == "movie"][10...20]{title} // first 10 movie titles, offset by 10
*[_type == "movie"] // no slice specified --> all movies are returned
```

**Also note**: The above queries don't make much sense without also specifying an order. E.g. the "first 6 movies" query only returns "first" movies in the sense that these are the first six movies the backend happens to pull out.

## Ordering

> [!TIP]
> Protip
> Documents are returned by default in ascending order by _id, which may not be what you're after. If you're querying for a subset of your documents, it's usually a good idea to specify an order.
>
> No matter what sort order is specified, the ascending order by _id will always remain the final tie-breaker.

```groq
// order results
*[_type == "movie"] | order(_createdAt asc)

// order results by multiple attributes
*[_type == "movie"] | order(releaseDate desc) | order(_createdAt asc)

// order todo items by descending priority,
// where priority is equal, list most recently updated
// item first
*[_type == "todo"] | order(priority desc, _updatedAt desc) 

// the single, oldest document
*[_type == "movie"] | order(_createdAt asc)[0]

// the single, newest document
*[_type == "movie"] | order(_createdAt desc)[0]

// oldest 10 documents
*[_type == "movie"] | order(_createdAt asc)[0..9]

// BEWARE! This selects 10 documents using the default
// ordering, and *only the selection* is ordered by
// _createdAt in ascending order
*[_type == "movie"][0..9] | order(_createdAt asc)

// limit/offset using external params (see client documentation)
*[_type == "movie"] | order(_createdAt asc) [$start..$end]

// order results alphabetically by a string field
// This is case sensitive, so A-Z come before a-z
*[_type == "movie"] | order(title asc)

// order results alphabetically by a string field,
// ignoring case
*[_type == "movie"] | order(lower(title) asc)
```

## Joins

```groq
// Fetch movies with title, and join with poster asset with path + url
*[_type=='movie']{title,poster{asset->{path,url}}}

// Say castMembers is an array containing objects with character name and a reference to the person:
// We want to fetch movie with title and an attribute named "cast" which is an array of actor names
*[_type=='movie']{title,'cast': castMembers[].person->name}

// Same query as above, except "cast" now contains objects with person._id and person.name
*[_type=='movie']{title,'cast': castMembers[].person->{_id, name}}

// Using the ^ operator to refer to the enclosing document. Here ^._id refers to the id
// of the enclosing person record.
*[_type=="person"]{
  name,
  "relatedMovies": *[_type=='movie' && references(^._id)]{ title }
}

// Books by author.name (book.author is a reference)
*[_type == "book" && author._ref in *[_type=="author" && name=="John Doe"]._id ]{...}

```

## Objects and Arrays

```groq
// Create your own objects
// https://groq.dev/lcGV0Km6dpvYovREqq1gLS
{
  // People ordered by Nobel prize year
  "peopleByPrizeYear": *[]|order(prizes[0].year desc){
  	"name": firstname + " " + surname,
    "orderYear": prizes[0].year,
    prizes
  },
  // List of all prizes ordered by year awarded
  "allPrizes": *[].prizes[]|order(year desc)
}

// Get all Nobel prizes from all root person documents
// https://groq.dev/v8T0DQawC6ihbNUf4cUeeS
*[].prizes[]

array::join(tags, ", ")                    // tags = ["Rust", "Go", null, "GROQ"] => "Rust, Go, <INVALID>, GROQ"
array::join(["a", "b", "c"], ".")          // "a.b.c"
array::join(year, ".")                     // year = 2024 => null (not an array)
array::join(values, 1)                     // values = [10, 20, 30] => null (separator must be a string)
array::compact(numbers)                    // numbers = [1, null, 2, null, 3] => [1, 2, 3]
array::unique(items)                       // items = [1, 2, 2, 3, 4, 5, 5] => [1, 2, 3, 4, 5]
array::unique(records)                     // records = [[1], [1]] => [[1], [1]] (arrays are not comparable)
array::intersects(firstList, secondList)   // firstList = [1, 2, 3], secondList = [3, 4, 5] => true
array::intersects(tags, keywords)          // tags = ["tech", "science"], keywords = ["art", "design"] => false
```

## Object Projections

```groq
// return only title
*[_type == 'movie']{title} 

// return values for multiple attributes
*[_type == 'movie']{_id, _type, title} 

// explicitly name the return field for _id
*[_type == 'movie']{'renamedId': _id, _type, title} 

// Return an array of attribute values (no object wrapper)
*[_type == 'movie'].title
*[_type == 'movie']{'characterNames': castMembers[].characterName}

// movie titled Arrival and its posterUrl
*[_type=='movie' && title == 'Arrival']{title,'posterUrl': poster.asset->url} 

// Explicitly return all attributes
*[_type == 'movie']{...} 

// Some computed attributes, then also add all attributes of the result
*[_type == 'movie']{'posterUrl': poster.asset->url, ...} 

// Default values when missing or null in document
*[_type == 'movie']{..., 'rating': coalesce(rating, 'unknown')}

// Number of elements in array 'actors' on each movie
*[_type == 'movie']{"actorCount": count(actors)} 

// Apply a projection to every member of an array
*[_type == 'movie']{castMembers[]{characterName, person}} 

// Filter embedded objects
*[_type == 'movie']{castMembers[characterName match 'Ripley']{characterName, person}} 

// Follow every reference in an array of references
*[_type == 'book']{authors[]->{name, bio}}

// Explicity name the outer return field
{'threeMovieTitles': *[_type=='movie'][0..2].title}

// Combining several unrelated queries in one request
{'featuredMovie': *[_type == 'movie' && title == 'Alien'][0], 'scifiMovies': *[_type == 'movie' && 'sci-fi' in genres]}

```

## Special variables

```groq
// *
*   // Everything, i.e. all documents

// @
*[ @["1"] ] // @ refers to the root value (document) of the scope
*[ @[$prop]._ref == $refId ] // Select reference prop from an outside variable.
*{"arraySizes": arrays[]{"size": count(@)}} // @ also works for nested scopes

// ^
// ^ refers to the enclosing document. Here ^._id refers to the id
// of the enclosing person record.
*[_type=="person"]{
  name,
  "relatedMovies": *[_type=='movie' && references(^._id)]{ title }
}
```

## Conditionals

```groq
// select() returns the first => pair whose left-hand side evaluates to true
*[_type=='movie']{..., "popularity": select(
  popularity > 20 => "high",
  popularity > 10 => "medium",
  popularity <= 10 => "low"
)}

// The first select() parameter without => is returned if no previous matches are found
*[_type=='movie']{..., "popularity": select(
  popularity > 20 => "high",
  popularity > 10 => "medium",
  "low"
)}

// Projections also have syntactic sugar for inline conditionals
*[_type=='movie']{
  ...,
  releaseDate >= '2018-06-01' => {
    "screenings": *[_type == 'screening' && movie._ref == ^._id],
    "news": *[_type == 'news' && movie._ref == ^._id],
  },
  popularity > 20 && rating > 7.0 => {
    "featured": true,
    "awards": *[_type == 'award' && movie._ref == ^._id],
  },
}

// The above is exactly equivalent to:
*[_type=='movie']{
  ...,
  ...select(releaseDate >= '2018-06-01' => {
    "screenings": *[_type == 'screening' && movie._ref == ^._id],
    "news": *[_type == 'news' && movie._ref == ^._id],
  }),
  ...select(popularity > 20 && rating > 7.0 => {
    "featured": true,
    "awards": *[_type == 'award' && movie._ref == ^._id],
  }),
}


// Specify sets of projections for different content types in an array
content[]{
  _type == 'type1' => {
    // Your selection of fields for type1
  },
  _type == 'type2' => {
    // Your selection of fields for type2
    "url": file.asset->url // Use joins to get data of referenced document
  }
}

```

### Handling references conditionally

In cases where an array contains both [references and non-references](https://www.sanity.io/docs/array-type#wT47gyCx), it's often desirable for a GROQ query to conditionally return the inline object (where dealing with non-references) or the referenced document (where dealing with references). This can be done by considering the `_type` of each array item and dereferencing the item (`@->`) if it's a reference or getting the whole object (`@`) if it's not a reference.

```groq
'content': content[]{
  _type == 'reference' => @->,
  _type != 'reference' => @,
}
```

## Functions

```groq
// any document that references the document 
// with id person_sigourney-weaver, 
// return only title
*[references("person_sigourney-weaver")]{title}

// Movies which reference ancient people
*[_type=="movie" && references(*[_type=="person" && age > 99]._id)]{title}

*[defined(tags)] // any document that has the attribute 'tags'

// coalesce takes a number of attribute references
// and returns the value of the first attribute
// that is non-null. In this example used to
// default back to the English language where a
// Finnish translation does not exist.
*{"title": coalesce(title.fi, title.en)} 

// count counts the number of items in a collection
count(*[_type == 'movie' && rating == 'R']) // returns number of R-rated movies

*[_type == 'movie']{
  title, 
  "actorCount": count(actors) // Counts the number of elements in the array actors
}

// round() rounds number to the nearest integer, or the given number of decimals
round(3.14) // 3
round(3.14, 1) // 3.1


// score() adds points to the score value depending 
// on the use of the string "GROQ" in each post's description 
// The value is then used to order the posts 
*[_type == "post"] 
  | score(description match "GROQ") 
  | order(_score desc) 
  { _score, title }

// boost() adds a defined boost integer to scores of items matching a condition 
// Adds 1 to the score for each time $term is matched in the title field
// Adds 3 to the score if (movie > 3) is true
*[_type == "movie" && movieRating > 3] | 
  score(
    title match $term,
    boost(movieRating > 8, 3)
  )

// Creates a scoring system where $term matching in the title
// is worth more than matching in the body
*[_type == "movie" && movieRating > 3] | score(
  boost(title match $term, 4),
  boost(body match $term, 1)
)

// Returns the body Portable Text data as plain text
*[_type == "post"] 
  { "plaintextBody": pt::text(body) }

// Get all versions and drafts of a document. Use with the raw perspective or a perspective stack to ensure accurate results.
*[sanity::versionOf('document-id')]

// Get all documents that are part of a release. Use with the raw perspective to ensure accurate results.
*[sanity::partOfRelease('release-id')]
```

## Geolocation

```groq
// Returns all documents that are storefronts
// within 10 miles of the user-provided currentLocation parameter
*[
  _type == 'storefront' &&
  geo::distance(geoPoint, $currentLocation) < 16093.4
]

// For a given $currentLocation geopoint and deliveryZone area
// Return stores that deliver to a user's location
*[
  _type == "storefront" &&
  geo::contains(deliveryZone, $currentLocation)
]

// Creates a "marathonRoutes" array that contains
// all marathons whose routes intersect with the current neighborhood
*[_type == "neighborhood"] {
  "marathonRoutes": *[_type == "marathon" && 
                      geo::intersects(^.neighborhoodRegion, routeLine)  
                    ]
}
```

## Arithmetic and Concatenation

```groq
// Standard arithmetic operations are supported
1 + 2  // 3 (addition)
3 - 2  // 1 (subtraction)
2 * 3  // 6 (multiplication)
8 / 4  // 2 (division)
2 ** 4 // 16 (exponentiation)
8 % 3  // 2 (modulo)

// Exponentiation can be used to take square- and cube-roots too
9 ** (1/2)  // 3 (square root)
27 ** (1/3) // 3 (cube root)

// + can also concatenate strings, arrays, and objects:
"abc" + "def" // "abcdef"
[1,2] + [3,4] // [1,2,3,4]
{"a":1,"b":2} + {"c":3} // {"a":1,"b":2,"c":3}

// Concatenation of a string and a number requires the number be
// converted to a string. Otherwise, the operation returns null
3 + " p.m."         // null
string(3) + " p.m." // "3 p.m."
```



