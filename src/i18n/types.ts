/**
 * A message is either a plain string, or a set of plural forms keyed by the
 * CLDR categories that Intl.PluralRules returns for a locale ('one', 'few',
 * 'many', 'other', …). English uses one/other; Russian uses one/few/many;
 * Chinese uses only 'other'. Always provide at least 'other'.
 */
export type Message = string | Partial<Record<Intl.LDMLPluralRule, string>>

export type Catalog = Record<string, Message>

/** Values interpolated into `{placeholders}`. `n`/`count` also select the plural form. */
export type Vars = Record<string, string | number>
