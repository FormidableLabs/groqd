/**
 * One use-case, conditional field-value:
 * {
 *   "popularity": select(
 *   	popularity > 20 => "high",
 *   	popularity > 10 => "medium",
 *   	"low"
 * 	)
 * }
 *
 * ^ This can be handled with something like:
 * q.grab({
 *   popularity: [`select(popularity > 20 => "high", popularity > 10 => "medium", "low")`, q.string()]
 * })
 *
 *
 * 🤔 Another tricky one... how do we spread here? Separate operator?
 * {
 *   ...select(popularity > 20 && rating > 7.0 => {
 *     "featured": true,
 *     "awards": *[_type == 'award' && movie._ref == ^._id],
 *   })
 * }
 * Do we even want to support this? Seems like it'd be hard to support typing dynamic fields like this...
 * 	Maybe just use field-level selects instead with optional schema.
 */
